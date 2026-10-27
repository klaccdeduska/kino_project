import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Uses only a uniquely named temporary database in the local Compose container.
const database = `kino_schedule_test_${Date.now()}`;
const args = ['compose', '-f', 'docker-compose.movies.yml', 'exec', '-T',
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
const seed = file('sessions');
try {
  sql(file('movies') + file('halls') + seed);
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
  for (const [current, previous] of [
    ['2026-10-21 17:45:00', '2026-10-21 17:00:00'],
    ['2026-10-22 23:20:00', '2026-10-22 20:30:00'],
    ['2026-10-23 19:30:00', '2026-10-23 17:30:00'],
    ['2026-10-23 22:00:00', '2026-10-23 20:00:00'],
    ['2026-10-24 23:00:00', '2026-10-24 22:00:00'],
  ]) old = old.replace(current, previous);
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
