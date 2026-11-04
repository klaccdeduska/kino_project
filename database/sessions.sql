USE kino;

CREATE TABLE IF NOT EXISTS sessions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  starts_at DATETIME NOT NULL, -- Cinema local time: Europe/Tallinn
  hall_id INT NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'English',
  subtitles VARCHAR(100) NULL,
  format VARCHAR(20) NOT NULL DEFAULT '2D',
  UNIQUE KEY uq_sessions_hall_start (hall_id, starts_at),

  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (hall_id) REFERENCES halls(id)
);

SET @demo_start = CURDATE() + INTERVAL 1 DAY;

INSERT INTO sessions (movie_id, starts_at, hall_id, language, subtitles, format)
VALUES
  (1, TIMESTAMP(@demo_start + INTERVAL 0 DAY, '14:30:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (1, TIMESTAMP(@demo_start + INTERVAL 0 DAY, '17:45:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (2, TIMESTAMP(@demo_start + INTERVAL 0 DAY, '15:00:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (2, TIMESTAMP(@demo_start + INTERVAL 1 DAY, '20:15:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (3, TIMESTAMP(@demo_start + INTERVAL 1 DAY, '18:00:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (3, TIMESTAMP(@demo_start + INTERVAL 1 DAY, '23:20:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (4, TIMESTAMP(@demo_start + INTERVAL 2 DAY, '16:45:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (4, TIMESTAMP(@demo_start + INTERVAL 2 DAY, '19:15:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (5, TIMESTAMP(@demo_start + INTERVAL 2 DAY, '19:30:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (5, TIMESTAMP(@demo_start + INTERVAL 2 DAY, '22:00:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (7, TIMESTAMP(@demo_start + INTERVAL 3 DAY, '19:30:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (7, TIMESTAMP(@demo_start + INTERVAL 3 DAY, '23:00:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (8, TIMESTAMP(@demo_start + INTERVAL 4 DAY, '14:00:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (8, TIMESTAMP(@demo_start + INTERVAL 4 DAY, '16:30:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (9, TIMESTAMP(@demo_start + INTERVAL 4 DAY, '18:15:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (9, TIMESTAMP(@demo_start + INTERVAL 4 DAY, '20:45:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (10, TIMESTAMP(@demo_start + INTERVAL 5 DAY, '15:30:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (10, TIMESTAMP(@demo_start + INTERVAL 5 DAY, '18:00:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (11, TIMESTAMP(@demo_start + INTERVAL 5 DAY, '19:45:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (11, TIMESTAMP(@demo_start + INTERVAL 5 DAY, '22:15:00'), 2, 'English', 'Estonian, Russian', '2D'),
  (12, TIMESTAMP(@demo_start + INTERVAL 6 DAY, '14:15:00'), 1, 'English', 'Estonian, Russian', '2D'),
  (12, TIMESTAMP(@demo_start + INTERVAL 6 DAY, '16:45:00'), 2, 'English', 'Estonian, Russian', '2D');
