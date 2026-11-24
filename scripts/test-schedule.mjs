import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Uses only a uniquely named temporary database in the local Compose container.
const database = `kino_schedule_test_${Date.now()}`;
const args = ['compose', 'exec', '-T',
  'db', 'sh', '-c', 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb -uroot --batch --skip-column-names'];
function sql(input, succeeds = true) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (succeeds) assert.equal(result.status, 0, result.stderr);
  else {
    assert.notEqual(result.status, 0, 'Expected duplicate constraint rejection');
    assert.match(result.stderr, /Duplicate entry/);
  }
  return result.stdout.trim();
}
function file(name) {
  return readFileSync(`database/${name}.sql`, 'utf8').replaceAll(/\bkino\b/g, database);
}
const overlaps = `SELECT COUNT(*) FROM sessions a
JOIN movies ma ON ma.id = a.movie_id
JOIN sessions b ON a.id < b.id AND a.hall_id = b.hall_id
JOIN movies mb ON mb.id = b.movie_id
WHERE a.starts_at < DATE_ADD(b.starts_at, INTERVAL mb.duration MINUTE)
AND b.starts_at < DATE_ADD(a.starts_at, INTERVAL ma.duration MINUTE);`;
const relativeSeed = file('sessions');
// The legacy migration targets the original 22 screenings starting on 21 October.
// Reuse the current weekly slots, anchored to those original dates for this fixture.
const seed = relativeSeed
  .replace(/SET @demo_monday = .*;/, "SET @demo_monday = DATE('2026-10-21');")
  .replace(/WHERE weeks\.week_offset \* 7 \+ slot\.day_offset >= WEEKDAY\(@demo_start\)\s+AND weeks\.week_offset \* 7 \+ slot\.day_offset < WEEKDAY\(@demo_start\) \+ 30/, 'WHERE weeks.week_offset = 0');
try {
  sql(file('movies') + file('halls') + relativeSeed);
  assert.equal(sql(`SELECT COUNT(*) FROM ${database}.sessions WHERE starts_at <= NOW();`), '0');
  sql(`USE ${database}; DROP TABLE sessions;`);
  sql(seed);
  assert.equal(sql(`SELECT COUNT(*) FROM ${database}.sessions;`), '22');
  assert.equal(sql(`USE ${database}; ${overlaps}`), '0');
  sql(file('halls'));
  assert.equal(sql(`SELECT COUNT(*) FROM ${database}.halls;`), '2');
  sql(`USE ${database}; INSERT INTO halls (name) VALUES ('Hall 1');`, false);
  sql(`USE ${database}; INSERT INTO sessions (movie_id, starts_at, hall_id)
SELECT movie_id, starts_at, hall_id FROM sessions LIMIT 1;`, false);
  sql(file('assign-session-halls'));
  assert.equal(sql(`USE ${database}; ${overlaps}`), '0');
  console.log('Fresh seed, repeated hall import, constraints and hall assignment passed.');

  // Recreate the original schema/schedule to verify the existing-database upgrade.
  sql(`USE ${database}; DROP TABLE sessions;
ALTER TABLE halls DROP INDEX uq_halls_name;`);
  let old = seed.replace('  UNIQUE KEY uq_sessions_hall_start (hall_id, starts_at),', '');
  for (const [day, current, previous] of [
    [0, '17:45:00', '17:00:00'],
    [1, '23:20:00', '20:30:00'],
    [2, '19:30:00', '17:30:00'],
    [2, '22:00:00', '20:00:00'],
    [3, '23:00:00', '22:00:00'],
  ]) old = old.replace(`SELECT ${day}, '${current}'`, `SELECT ${day}, '${previous}'`);
  sql(old);
  assert.equal(sql(`USE ${database}; ${overlaps}`), '5');
  const ids = sql(`SELECT GROUP_CONCAT(id ORDER BY id) FROM ${database}.sessions;`);
  sql(file('assign-session-halls') + file('fix-demo-schedule'));
  assert.equal(sql(`USE ${database}; ${overlaps}`), '0');
  assert.equal(sql(`SELECT GROUP_CONCAT(id ORDER BY id) FROM ${database}.sessions;`), ids);
  sql(file('fix-demo-schedule') + file('assign-session-halls'));
  assert.equal(sql(`USE ${database}; ${overlaps}`), '0');
  assert.equal(sql(`SELECT COUNT(*) FROM ${database}.sessions;`), '22');
  console.log('Upgrade removes all five overlaps, preserves IDs and supports reruns.');
} finally {
  sql(`DROP DATABASE IF EXISTS ${database};`);
}
