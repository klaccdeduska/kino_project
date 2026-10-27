USE kino;

-- Run once on an existing database, after assign-session-halls.sql.
-- These indexes deliberately fail if duplicate data needs manual review.
-- No halls or sessions are deleted automatically.
ALTER TABLE halls ADD UNIQUE INDEX IF NOT EXISTS uq_halls_name (name);
ALTER TABLE sessions ADD UNIQUE INDEX IF NOT EXISTS uq_sessions_hall_start (hall_id, starts_at);

-- Only move the five original demo showings; preserve their session IDs.
START TRANSACTION;
UPDATE sessions AS s
JOIN halls AS h ON h.id = s.hall_id
SET s.starts_at = CASE
  WHEN s.movie_id = 1 THEN '2026-10-21 17:45:00'
  WHEN s.movie_id = 3 THEN '2026-10-22 23:20:00'
  WHEN s.movie_id = 5 AND h.name = 'Hall 1' THEN '2026-10-23 19:30:00'
  WHEN s.movie_id = 5 AND h.name = 'Hall 2' THEN '2026-10-23 22:00:00'
  WHEN s.movie_id = 7 THEN '2026-10-24 23:00:00'
END
WHERE (s.movie_id = 1 AND h.name = 'Hall 1' AND s.starts_at = '2026-10-21 17:00:00')
   OR (s.movie_id = 3 AND h.name = 'Hall 2' AND s.starts_at = '2026-10-22 20:30:00')
   OR (s.movie_id = 5 AND h.name = 'Hall 1' AND s.starts_at = '2026-10-23 17:30:00')
   OR (s.movie_id = 5 AND h.name = 'Hall 2' AND s.starts_at = '2026-10-23 20:00:00')
   OR (s.movie_id = 7 AND h.name = 'Hall 1' AND s.starts_at = '2026-10-24 22:00:00');
COMMIT;
