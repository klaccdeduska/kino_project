SELECT id, movie_id, hall_id, starts_at
FROM benchmark_sessions
IGNORE INDEX (idx_sessions_movie_id)
WHERE movie_id = 250
ORDER BY starts_at;