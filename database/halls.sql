USE kino;

CREATE TABLE IF NOT EXISTS halls (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_halls_name (name)
);

INSERT INTO halls (id, name)
VALUES
  (1, 'Hall 1'),
  (2, 'Hall 2')
ON DUPLICATE KEY UPDATE id = id;
