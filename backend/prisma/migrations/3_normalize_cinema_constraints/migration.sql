ALTER TABLE movies
    ADD CONSTRAINT chk_movies_age_rating CHECK (age_rating IN ('All', '6+', '9+', '12+', '15+', '18+')),
    MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;

ALTER TABLE users MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;

-- Both the original seed and the old hall upgrade may have created these keys.
ALTER TABLE sessions
    DROP FOREIGN KEY IF EXISTS sessions_ibfk_1,
    DROP FOREIGN KEY IF EXISTS sessions_ibfk_2,
    DROP FOREIGN KEY IF EXISTS fk_sessions_hall,
    ADD CONSTRAINT sessions_movie_id_fkey
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT sessions_hall_id_fkey
        FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

UPDATE movies
SET poster_url = 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg'
WHERE id = 3 AND poster_url IN (
    'https://thumb.wikimedia.org/wikipedia/en/thumb/4/4a/Oppenheimer_%28film%29.jpg/250px-Oppenheimer_%28film%29.jpg',
    'https://thumb.wikimedia.org/wikipedia/en/thumb/4/4a/Oppenheimer_%28film%29.jpg/250px-Oppenheimer_%28film%29.jpg?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail'
);

UPDATE movies
SET poster_url = 'https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png'
WHERE id = 6 AND poster_url =
    'https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original';
