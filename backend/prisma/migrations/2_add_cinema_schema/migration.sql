CREATE TABLE IF NOT EXISTS halls (
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    UNIQUE KEY uq_halls_name (name)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    movie_id INTEGER NOT NULL,
    starts_at DATETIME NOT NULL,
    hall_id INTEGER NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'English',
    subtitles VARCHAR(100) NULL,
    format VARCHAR(20) NOT NULL DEFAULT '2D',
    UNIQUE KEY uq_sessions_hall_start (hall_id, starts_at),
    KEY movie_id (movie_id),
    CONSTRAINT sessions_ibfk_1 FOREIGN KEY (movie_id) REFERENCES movies(id),
    CONSTRAINT fk_sessions_hall FOREIGN KEY (hall_id) REFERENCES halls(id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NULL,
    date_of_birth DATE NULL,
    language VARCHAR(5) NOT NULL DEFAULT 'et',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY email (email)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Existing databases may predate the account profile or scheduling constraints.
ALTER TABLE halls ADD UNIQUE INDEX IF NOT EXISTS uq_halls_name (name);
ALTER TABLE sessions ADD UNIQUE INDEX IF NOT EXISTS uq_sessions_hall_start (hall_id, starts_at);
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS name VARCHAR(100) NULL AFTER password_hash,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL AFTER name,
    ADD COLUMN IF NOT EXISTS language VARCHAR(5) NOT NULL DEFAULT 'et' AFTER date_of_birth;
