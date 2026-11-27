-- MariaDB sequence tables provide contiguous IDs without a separate generator.
START TRANSACTION;

INSERT INTO movies (id, title, genre, duration, description, release_year, director, age_rating)
SELECT seq, CONCAT('Benchmark film ', seq), 'Drama', 100, 'Synthetic benchmark film',
       2025, 'Benchmark director', 'All'
FROM seq_1_to_100;

INSERT INTO halls (id, name)
SELECT seq, CONCAT('Benchmark hall ', seq)
FROM seq_1_to_10;

SET @schedule_start = CURRENT_DATE - INTERVAL 500 DAY;

-- Each film has 1,000 screenings across 10 halls. The schedule begins
-- 500 days ago so roughly half of the sessions pass the upcoming filter.
INSERT INTO sessions (id, movie_id, starts_at, hall_id)
SELECT seq + 1,
       MOD(FLOOR(seq / 10), 100) + 1,
       TIMESTAMPADD(MINUTE, FLOOR(seq / 10) * 144, @schedule_start),
       MOD(seq, 10) + 1
FROM seq_0_to_99999;

COMMIT;

ANALYZE TABLE movies, halls, sessions;
