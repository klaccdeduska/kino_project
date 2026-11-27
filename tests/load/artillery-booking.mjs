import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const compose = [
  'compose', '-p', 'kino-artillery', '-f', 'tests/load/artillery-compose.yaml',
];
const npm = process.env.npm_execpath;
const target = 'http://127.0.0.1:3105/api/load-test/sessions/1/bookings';

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['inherit', capture ? 'pipe' : 'inherit', 'inherit'],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
  return result.stdout?.trim();
}

function query(sql) {
  return run('docker', [
    ...compose, 'exec', '-T', 'db', 'mariadb', '--batch', '--skip-column-names',
    '--user=artillery', '--password=artillery_local', 'kino_artillery', '-e', sql,
  ], true);
}

async function waitForApi(api) {
  for (let attempt = 0; attempt < 50 && api.exitCode === null; attempt += 1) {
    // Invalid input reaches the booking controller without adding a row.
    const response = await fetch(target, {
      method: 'POST',
      signal: AbortSignal.timeout(500),
    }).catch(() => undefined);
    if (response?.status === 400) return;
    await sleep(200);
  }
  throw new Error('The local booking API did not start on port 3105');
}

run('docker', [...compose, 'up', '-d', '--wait']);
run(process.execPath, [npm, '--prefix', 'backend', 'run', 'build']);

const api = spawn(process.execPath, ['dist/main.js'], {
  cwd: 'backend',
  env: { ...process.env, KINO_BOOKING_LOAD: '1' },
  stdio: 'inherit',
});

try {
  await waitForApi(api);
  const targetSeat = "session_id = 1 AND seat = 'A-1'";
  query(`DELETE FROM artillery_bookings WHERE ${targetSeat}`);
  console.log(`Seeded bookings: ${query('SELECT COUNT(*) FROM artillery_bookings')}`);

  const report = join(mkdtempSync(join(tmpdir(), 'kino-artillery-')), 'report.json');
  run(process.execPath, [
    npm, 'exec', '--yes', '--package=artillery@2.0.34', '--',
    'artillery', 'run', '--output', report, 'tests/load/artillery-booking.yaml',
  ]);

  const { aggregate } = JSON.parse(readFileSync(report, 'utf8'));
  const { counters } = aggregate;
  const created = counters['http.codes.201'] ?? 0;
  const conflicts = counters['http.codes.409'] ?? 0;
  const stored = Number(query(`SELECT COUNT(*) FROM artillery_bookings WHERE ${targetSeat}`));
  console.log(`Created: ${created}, conflicts: ${conflicts}, stored rows: ${stored}`);
  console.log(`Report: ${report}`);
  if (counters['vusers.completed'] !== 20 || counters['http.requests'] !== 20 ||
      created !== 1 || conflicts !== 19 || stored !== 1) {
    throw new Error('The booking race must produce 1 creation, 19 conflicts and 1 stored row');
  }
} finally {
  api.kill();
}
