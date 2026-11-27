CREATE TABLE artillery_bookings (
    session_id INT NOT NULL,
    seat VARCHAR(4) NOT NULL,
    PRIMARY KEY (session_id, seat),
    FOREIGN KEY (session_id) REFERENCES sessions (id)
) ENGINE=InnoDB;

INSERT INTO movies (id, title, genre, duration, description, release_year, director, age_rating)
VALUES (1, 'Premiere Night', 'Drama', 120, 'Booking load fixture', 2026, 'Test Director', 'All');

INSERT INTO halls (id, name) VALUES (1, 'Premiere Hall');

INSERT INTO sessions (id, movie_id, starts_at, hall_id)
SELECT seq + 1, 1, TIMESTAMPADD(HOUR, seq * 3, '2035-01-01 18:00:00'), 1
FROM seq_0_to_9999;

INSERT INTO artillery_bookings (session_id, seat)
SELECT sessions.id, CONCAT('A-', seats.seq)
FROM sessions CROSS JOIN seq_2_to_6 AS seats;
