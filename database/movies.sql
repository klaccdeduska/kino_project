-- BOOBLICKI Cinema - demo movie catalog
-- Age ratings are illustrative, not official Estonian age classifications.
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

INSERT INTO movies (id, title, genre, duration, description, release_year, director, age_rating, poster_url, trailer_url)
VALUES
(1, 'Dune: Part Two', 'Science fiction / Adventure', 166, 'Paul Atreides joins the Fremen and faces a choice between love and the fate of the universe.', 2024, 'Denis Villeneuve', '12+', 'https://s3.amazonaws.com/nightjarprod/content/uploads/sites/189/2024/05/29150236/czembW0Rk1Ke7lCJGahbOhdCuhV-scaled.jpg', NULL),
(2, 'Interstellar', 'Science fiction / Drama', 169, 'A team of astronauts travels beyond Earth in search of a new home for humanity.', 2014, 'Christopher Nolan', '12+', 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_.jpg', NULL),
(3, 'Oppenheimer', 'Biography / Drama', 180, 'The story of physicist J. Robert Oppenheimer and the development of the atomic bomb.', 2023, 'Christopher Nolan', '15+', 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/4a/Oppenheimer_%28film%29.jpg/250px-Oppenheimer_%28film%29.jpg?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail', NULL),
(4, 'Inception', 'Science fiction / Thriller', 148, 'A skilled thief enters dreams to steal secrets and attempts an impossible new mission.', 2010, 'Christopher Nolan', '12+', 'https://m.media-amazon.com/images/M/MV5BZjhkNjM0ZTMtNGM5MC00ZTQ3LTk3YmYtZTkzYzdiNWE0ZTA2XkEyXkFqcGc@._V1_.jpg', NULL),
(5, 'The Dark Knight', 'Action / Crime', 152, 'Batman faces the Joker, whose crimes push Gotham City toward chaos.', 2008, 'Christopher Nolan', '12+', 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg', NULL),
(6, 'The Matrix', 'Science fiction / Action', 136, 'A hacker discovers that the world around him is a simulation.', 1999, 'Lana Wachowski, Lilly Wachowski', '15+', 'https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original', NULL),
(7, 'Avatar: The Way of Water', 'Science fiction / Adventure', 192, 'Jake Sully and his family seek refuge among the ocean clans of Pandora.', 2022, 'James Cameron', '12+', 'https://lumiere-a.akamaihd.net/v1/images/p_disneyplusoriginals_avatar_thewayofwater_poster_rebra_fa08636d.jpeg', NULL),
(8, 'Spider-Man: Across the Spider-Verse', 'Animation / Adventure', 140, 'Miles Morales travels across the multiverse and meets a team of Spider-People.', 2023, 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson', '9+', 'https://m.media-amazon.com/images/M/MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA4Y2E0M2ZmXkEyXkFqcGc@._V1_.jpg', NULL),
(9, 'Barbie', 'Comedy / Fantasy', 114, 'Barbie leaves Barbieland and explores the real world in search of answers.', 2023, 'Greta Gerwig', '12+', 'https://play-lh.googleusercontent.com/PhI5HgXUMHOIkvwvR7Ul2NvdbbTOHxSMprz9RTUxNOgYmNbm8t4JSLrM6bVBDNxP5Ijd4HFPo6pHZCSgwQo', NULL),
(10, 'The Batman', 'Action / Crime', 176,
'Batman investigates a serial killer targeting prominent figures in Gotham.',
2022, 'Matt Reeves', '15+',
'https://upload.wikimedia.org/wikipedia/ru/archive/b/b2/20250325133255%21The_Batman_Poster.jpg',
NULL),
(11, 'Everything Everywhere All at Once', 'Science fiction / Comedy', 139, 'A laundromat owner becomes involved in a conflict spanning many universes.', 2022, 'Daniel Kwan, Daniel Scheinert', '15+', 'https://m.media-amazon.com/images/M/MV5BOWNmMzAzZmQtNDQ1NC00Nzk5LTkyMmUtNGI2N2NkOWM4MzEyXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', NULL),
(12, 'Whiplash', 'Drama / Music', 106, 'An ambitious young drummer trains under a demanding music instructor.', 2014, 'Damien Chazelle', '15+', 'https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p10488558_p_v12_ai.jpg', NULL)

ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  genre = VALUES(genre),
  duration = VALUES(duration),
  description = VALUES(description),
  release_year = VALUES(release_year),
  director = VALUES(director),
  age_rating = VALUES(age_rating),
  poster_url = VALUES(poster_url),
  trailer_url = VALUES(trailer_url);
