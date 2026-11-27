SELECT id, movie_id, hall_id, starts_at
FROM benchmark_sessions
WHERE movie_id = 250
ORDER BY starts_at;