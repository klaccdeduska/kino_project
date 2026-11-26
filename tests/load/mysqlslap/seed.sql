CREATE DATABASE IF NOT EXISTS kino_benchmark;

USE kino_benchmark;

CREATE TABLE IF NOT EXISTS benchmark_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    hall_id INT NOT NULL,
    starts_at DATETIME NOT NULL,
    language VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

TRUNCATE TABLE benchmark_sessions;

INSERT INTO benchmark_sessions (
    movie_id,
    hall_id,
    starts_at,
    language,
    format
)
SELECT
    MOD(seq, 500) + 1,
    MOD(seq, 10) + 1,
    DATE_ADD('2027-01-01 10:00:00', INTERVAL seq MINUTE),
    ELT(MOD(seq, 3) + 1, 'English', 'Estonian', 'Russian'),
    ELT(MOD(seq, 2) + 1, '2D', '3D')
FROM seq_1_to_100000;

SELECT COUNT(*) AS total_sessions
FROM benchmark_sessions;