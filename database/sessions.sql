USE kino;

CREATE TABLE IF NOT EXISTS sessions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  starts_at DATETIME NOT NULL,
  hall_id INT NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'English',
  subtitles VARCHAR(100) NULL,
  format VARCHAR(20) NOT NULL DEFAULT '2D',

  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (hall_id) REFERENCES halls(id)
);

INSERT INTO sessions (movie_id, starts_at, hall_id, language, subtitles, format)
VALUES
  (1, '2026-10-21 14:30:00', 1, 'English', 'Estonian, Russian', '2D'),
  (1, '2026-10-21 17:00:00', 1, 'English', 'Estonian, Russian', '2D'),
  (2, '2026-10-21 15:00:00', 2, 'English', 'Estonian, Russian', '2D'),
  (2, '2026-10-22 20:15:00', 2, 'English', 'Estonian, Russian', '2D'),
  (3, '2026-10-22 18:00:00', 1, 'English', 'Estonian, Russian', '2D'),
  (3, '2026-10-22 20:30:00', 2, 'English', 'Estonian, Russian', '2D'),
  (4, '2026-10-23 16:45:00', 1, 'English', 'Estonian, Russian', '2D'),
  (4, '2026-10-23 19:15:00', 2, 'English', 'Estonian, Russian', '2D'),
  (5, '2026-10-23 17:30:00', 1, 'English', 'Estonian, Russian', '2D'),
  (5, '2026-10-23 20:00:00', 2, 'English', 'Estonian, Russian', '2D'),
  (7, '2026-10-24 19:30:00', 1, 'English', 'Estonian, Russian', '2D'),
  (7, '2026-10-24 22:00:00', 1, 'English', 'Estonian, Russian', '2D'),
  (8, '2026-10-25 14:00:00', 2, 'English', 'Estonian, Russian', '2D'),
  (8, '2026-10-25 16:30:00', 2, 'English', 'Estonian, Russian', '2D'),
  (9, '2026-10-25 18:15:00', 1, 'English', 'Estonian, Russian', '2D'),
  (9, '2026-10-25 20:45:00', 2, 'English', 'Estonian, Russian', '2D'),
  (10, '2026-10-26 15:30:00', 1, 'English', 'Estonian, Russian', '2D'),
  (10, '2026-10-26 18:00:00', 2, 'English', 'Estonian, Russian', '2D'),
  (11, '2026-10-26 19:45:00', 1, 'English', 'Estonian, Russian', '2D'),
  (11, '2026-10-26 22:15:00', 2, 'English', 'Estonian, Russian', '2D'),
  (12, '2026-10-27 14:15:00', 1, 'English', 'Estonian, Russian', '2D'),
  (12, '2026-10-27 16:45:00', 2, 'English', 'Estonian, Russian', '2D');
