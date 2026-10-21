USE kino;

UPDATE sessions AS s
JOIN halls AS h ON h.name = CASE
  WHEN s.movie_id IN (2, 8)
    OR (s.movie_id = 3 AND TIME(s.starts_at) = '20:30:00')
    OR (s.movie_id = 4 AND TIME(s.starts_at) = '19:15:00')
    OR (s.movie_id = 5 AND TIME(s.starts_at) = '20:00:00')
    OR (s.movie_id = 9 AND TIME(s.starts_at) = '20:45:00')
    OR (s.movie_id = 10 AND TIME(s.starts_at) = '18:00:00')
    OR (s.movie_id = 11 AND TIME(s.starts_at) = '22:15:00')
    OR (s.movie_id = 12 AND TIME(s.starts_at) = '16:45:00')
  THEN 'Hall 2'
  ELSE 'Hall 1'
END
SET s.hall_id = h.id;