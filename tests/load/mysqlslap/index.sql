USE kino_benchmark;

CREATE INDEX IF NOT EXISTS idx_sessions_movie_id
ON benchmark_sessions (movie_id);

ANALYZE TABLE benchmark_sessions;

SHOW INDEX FROM benchmark_sessions;