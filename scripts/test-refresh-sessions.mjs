import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { refreshSessions } from './refresh-sessions.mjs';

const require = createRequire(new URL('../backend/package.json', import.meta.url));
const config = require('dotenv').config({ path: new URL('../backend/.env', import.meta.url), quiet: true }).parsed;
const mysql = require('mysql2/promise');
const connection = await mysql.createConnection({
  host: config.DB_HOST, port: Number(config.DB_PORT), user: config.DB_USER,
  password: config.DB_PASSWORD, database: config.DB_NAME, multipleStatements: true,
});
try {
  // Temporary tables shadow real tables only on this connection. Production
  // movies, sessions and halls are never modified by this test.
  for (const table of ['movies', 'halls']) {
    await connection.query(`CREATE TEMPORARY TABLE test_${table} LIKE ${table}`);
    await connection.query(`INSERT INTO test_${table} SELECT * FROM ${table}`);
    await connection.query(`CREATE TEMPORARY TABLE ${table} LIKE test_${table}`);
    await connection.query(`INSERT INTO ${table} SELECT * FROM test_${table}`);
  }
  await connection.query('CREATE TEMPORARY TABLE test_sessions LIKE sessions');
  await connection.query('CREATE TEMPORARY TABLE sessions LIKE test_sessions');
  await connection.query(`INSERT INTO sessions (id, movie_id, hall_id, starts_at)
    VALUES (5000, 1, 1, '2026-01-01 14:30:00')`);
  const first = await refreshSessions(connection);
  assert.ok(first.added >= 98 && first.added <= 102);
  assert.equal(first.skipped, 0);
  const second = await refreshSessions(connection);
  assert.equal(second.added, 0);
  const [[counts]] = await connection.query(`SELECT COUNT(*) AS total,
    SUM(starts_at > NOW()) AS upcoming,
    COUNT(DISTINCT CASE WHEN starts_at > NOW() THEN DATE(starts_at) END) AS days,
    COUNT(DISTINCT CASE WHEN starts_at > NOW() THEN movie_id END) AS movies,
    MIN(CASE WHEN starts_at > NOW() THEN DATEDIFF(starts_at, CURDATE()) END) AS first_day,
    MAX(DATEDIFF(starts_at, CURDATE())) AS last_day FROM sessions`);
  assert.equal(Number(counts.total), first.added + 1);
  assert.equal(Number(counts.upcoming), first.added);
  assert.equal(Number(counts.days), 30);
  assert.equal(Number(counts.movies), 12);
  assert.equal(Number(counts.first_day), 1);
  assert.equal(Number(counts.last_day), 30);
  const [[old]] = await connection.query('SELECT movie_id FROM sessions WHERE id = 5000');
  assert.equal(old.movie_id, 1);
  const [[overlaps]] = await connection.query(`SELECT COUNT(*) AS count FROM sessions a
    JOIN movies ma ON ma.id = a.movie_id
    JOIN sessions b ON a.id < b.id AND a.hall_id = b.hall_id
    JOIN movies mb ON mb.id = b.movie_id
    WHERE a.starts_at < DATE_ADD(b.starts_at, INTERVAL mb.duration MINUTE)
      AND b.starts_at < DATE_ADD(a.starts_at, INTERVAL ma.duration MINUTE)`);
  assert.equal(Number(overlaps.count), 0);

  const [[slot]] = await connection.query('SELECT id FROM sessions ORDER BY starts_at LIMIT 1 OFFSET 1');
  await connection.execute('DELETE FROM sessions WHERE id <> 5000 AND id <> ?', [slot.id]);
  await connection.execute('UPDATE sessions SET starts_at = starts_at - INTERVAL 1 MINUTE WHERE id = ?', [slot.id]);
  const [[before]] = await connection.execute('SELECT CAST(starts_at AS CHAR) AS starts_at FROM sessions WHERE id = ?', [slot.id]);
  const custom = await refreshSessions(connection);
  assert.equal(custom.added, first.added - 1);
  assert.equal(custom.skipped, 1);
  const [[preserved]] = await connection.execute('SELECT CAST(starts_at AS CHAR) AS starts_at FROM sessions WHERE id = ?', [slot.id]);
  assert.deepEqual(preserved, before);
  console.log('Refresh passed: upcoming shows, reruns, preserved history and custom-show conflict checks.');
} finally {
  await connection.end();
}
