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
-- Keep the same slots on each weekday so a later refresh can extend the schedule.
SET @demo_monday = DATE_SUB(@demo_start, INTERVAL WEEKDAY(@demo_start) DAY);

INSERT INTO sessions (movie_id, starts_at, hall_id, language, subtitles, format)
SELECT slot.movie_id, TIMESTAMP(DATE_ADD(@demo_monday, INTERVAL (weeks.week_offset * 7 + slot.day_offset) DAY), slot.start_time),
       slot.hall_id, 'English', 'Estonian, Russian', '2D'
FROM (
  SELECT 0 AS day_offset, '14:30:00' AS start_time, 1 AS movie_id, 1 AS hall_id
  UNION ALL SELECT 0, '17:45:00', 1, 1
  UNION ALL SELECT 0, '15:00:00', 2, 2
  UNION ALL SELECT 1, '20:15:00', 2, 2
  UNION ALL SELECT 1, '18:00:00', 3, 1
  UNION ALL SELECT 1, '23:20:00', 3, 2
  UNION ALL SELECT 2, '16:45:00', 4, 1
  UNION ALL SELECT 2, '19:15:00', 4, 2
  UNION ALL SELECT 2, '19:30:00', 5, 1
  UNION ALL SELECT 2, '22:00:00', 5, 2
  UNION ALL SELECT 3, '16:30:00', 6, 2
  UNION ALL SELECT 3, '19:30:00', 7, 1
  UNION ALL SELECT 3, '23:00:00', 7, 1
  UNION ALL SELECT 4, '14:00:00', 8, 2
  UNION ALL SELECT 4, '16:30:00', 8, 2
  UNION ALL SELECT 4, '18:15:00', 9, 1
  UNION ALL SELECT 4, '20:45:00', 9, 2
  UNION ALL SELECT 5, '15:30:00', 10, 1
  UNION ALL SELECT 5, '18:00:00', 10, 2
  UNION ALL SELECT 5, '19:45:00', 11, 1
  UNION ALL SELECT 5, '22:15:00', 11, 2
  UNION ALL SELECT 6, '14:15:00', 12, 1
  UNION ALL SELECT 6, '16:45:00', 12, 2
) AS slot
CROSS JOIN (
  SELECT 0 AS week_offset UNION ALL SELECT 1 UNION ALL SELECT 2
  UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
) AS weeks
WHERE weeks.week_offset * 7 + slot.day_offset >= WEEKDAY(@demo_start)
  AND weeks.week_offset * 7 + slot.day_offset < WEEKDAY(@demo_start) + 30
ORDER BY weeks.week_offset, slot.day_offset, slot.start_time, slot.hall_id;
