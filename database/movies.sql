-- BOOBLICKI Cinema: educational demonstration catalog
-- Age ratings are illustrative labels, not official Estonian classifications.
CREATE DATABASE IF NOT EXISTS kino CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kino;
CREATE TABLE IF NOT EXISTS movies (
 id INT NOT NULL PRIMARY KEY,
 title VARCHAR(255) NOT NULL,
 genre VARCHAR(255) NOT NULL,
 duration INT UNSIGNED NOT NULL,
 description TEXT NOT NULL,
 release_year SMALLINT UNSIGNED NOT NULL,
 director VARCHAR(255) NOT NULL,
 age_rating VARCHAR(20) NOT NULL,
 poster_url VARCHAR(1000) NULL,
 trailer_url VARCHAR(1000) NULL
);
INSERT INTO movies (id,title,genre,duration,description,release_year,director,age_rating,poster_url,trailer_url)
VALUES
(1, 'Dune: Part Two', 'Science fiction / Adventure', 166, 'Paul Atreides joins the Fremen and faces a choice between love and the fate of the universe.', 2024, 'Denis Villeneuve', '12+', NULL, NULL),
(2, 'Interstellar', 'Science fiction / Drama', 169, 'A team of astronauts travels beyond Earth in search of a new home for humanity.', 2014, 'Christopher Nolan', '12+', NULL, NULL),
(3, 'Oppenheimer', 'Biography / Drama', 180, 'The story of physicist J. Robert Oppenheimer and the development of the atomic bomb.', 2023, 'Christopher Nolan', '15+', NULL, NULL),
(4, 'Inception', 'Science fiction / Thriller', 148, 'A skilled thief enters dreams to steal secrets and attempts an impossible new mission.', 2010, 'Christopher Nolan', '12+', NULL, NULL),
(5, 'The Dark Knight', 'Action / Crime', 152, 'Batman faces the Joker, whose crimes push Gotham City toward chaos.', 2008, 'Christopher Nolan', '12+', NULL, NULL),
(6, 'The Matrix', 'Science fiction / Action', 136, 'A hacker discovers that the world around him is a simulation.', 1999, 'Lana Wachowski, Lilly Wachowski', '15+', NULL, NULL),
(7, 'Avatar: The Way of Water', 'Science fiction / Adventure', 192, 'Jake Sully and his family seek refuge among the ocean clans of Pandora.', 2022, 'James Cameron', '12+', NULL, NULL),
(8, 'Spider-Man: Across the Spider-Verse', 'Animation / Adventure', 140, 'Miles Morales travels across the multiverse and meets a team of Spider-People.', 2023, 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson', '9+', NULL, NULL),
(9, 'Barbie', 'Comedy / Fantasy', 114, 'Barbie leaves Barbieland and explores the real world in search of answers.', 2023, 'Greta Gerwig', '12+', NULL, NULL),
(10, 'The Batman', 'Action / Crime', 176, 'Batman investigates a serial killer targeting prominent figures in Gotham.', 2022, 'Matt Reeves', '15+', NULL, NULL),
(11, 'Everything Everywhere All at Once', 'Science fiction / Comedy', 139, 'A laundromat owner becomes involved in a conflict spanning many universes.', 2022, 'Daniel Kwan, Daniel Scheinert', '15+', NULL, NULL),
(12, 'Whiplash', 'Drama / Music', 106, 'An ambitious young drummer trains under a demanding music instructor.', 2014, 'Damien Chazelle', '15+', NULL, NULL)
ON DUPLICATE KEY UPDATE
 title=VALUES(title), genre=VALUES(genre), duration=VALUES(duration), description=VALUES(description),
 release_year=VALUES(release_year), director=VALUES(director), age_rating=VALUES(age_rating);
