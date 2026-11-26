-- Optimize screening queries filtered by movie and start time.
CREATE INDEX `idx_sessions_movie_start`
ON `sessions` (`movie_id`, `starts_at`);