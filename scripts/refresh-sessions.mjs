import { readFileSync } from 'node:fs';

// Reuse the fresh-install schedule rather than maintaining a second movie list.
const seed = readFileSync(new URL('../database/sessions.sql', import.meta.url), 'utf8');
const seedStart = seed.indexOf('SET @demo_start');
if (seedStart < 0) throw new Error('Demo schedule is missing its relative start date.');

export async function refreshSessions(connection) {
  const [[lock]] = await connection.query(
    "SELECT GET_LOCK(CONCAT(DATABASE(), ':demo-sessions'), 10) AS acquired",
  );
  if (Number(lock.acquired) !== 1) throw new Error('Another schedule update is running. Try again.');
  let added = 0;
  try {
    await connection.query('DROP TEMPORARY TABLE IF EXISTS demo_session_candidates');
    await connection.query('CREATE TEMPORARY TABLE demo_session_candidates LIKE sessions');
    await connection.query(seed.slice(seedStart).replace('INSERT INTO sessions', 'INSERT INTO demo_session_candidates'));
    const [candidates] = await connection.query('SELECT * FROM demo_session_candidates ORDER BY starts_at, hall_id, id');
    await connection.beginTransaction();
    for (const candidate of candidates) {
      // Preserve existing IDs, tickets and custom shows. Check the full duration,
      // including overlaps across midnight, before adding each new showing.
      const [result] = await connection.execute(`
        INSERT INTO sessions (movie_id, starts_at, hall_id, language, subtitles, format)
        SELECT m.id, ?, h.id, ?, ?, ? FROM movies m JOIN halls h ON h.id = ?
        WHERE m.id = ? AND NOT EXISTS (
          SELECT 1 FROM sessions s JOIN movies existing ON existing.id = s.movie_id
          WHERE s.hall_id = h.id AND (
            s.starts_at = ? OR (
              s.starts_at < DATE_ADD(?, INTERVAL m.duration MINUTE)
              AND DATE_ADD(s.starts_at, INTERVAL existing.duration MINUTE) > ?
            )
          )
        )`, [candidate.starts_at, candidate.language, candidate.subtitles, candidate.format,
        candidate.hall_id, candidate.movie_id, candidate.starts_at, candidate.starts_at, candidate.starts_at]);
      added += result.affectedRows;
    }
    await connection.commit();
    return { added, skipped: candidates.length - added };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.query('DROP TEMPORARY TABLE IF EXISTS demo_session_candidates');
    await connection.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':demo-sessions'))");
  }
}
