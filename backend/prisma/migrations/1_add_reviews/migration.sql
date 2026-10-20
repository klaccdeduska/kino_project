CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `author_name` VARCHAR(100) NOT NULL,
    `text` TEXT NOT NULL,
    `movie_id` INTEGER NOT NULL,
    INDEX `reviews_movie_id_idx` (`movie_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `reviews` ADD CONSTRAINT `reviews_movie_id_fkey`
    FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
