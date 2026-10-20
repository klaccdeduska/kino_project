-- Baseline of database/movies.sql. On an existing kino database, mark this
-- migration applied instead of executing CREATE TABLE again (see README).
CREATE TABLE `movies` (
    `id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `genre` VARCHAR(255) NOT NULL,
    `duration` INTEGER UNSIGNED NOT NULL,
    `description` TEXT NOT NULL,
    `release_year` SMALLINT UNSIGNED NOT NULL,
    `director` VARCHAR(255) NOT NULL,
    `age_rating` VARCHAR(20) NOT NULL,
    `poster_url` VARCHAR(1000) NULL,
    `trailer_url` VARCHAR(1000) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
