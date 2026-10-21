USE kino;
  
  ALTER TABLE sessions
  ADD COLUMN hall_id INT NULL,
  ADD CONSTRAINT fk_sessions_hall
    FOREIGN KEY (hall_id) REFERENCES halls(id);

UPDATE sessions
SET hall_id = (
  SELECT id
  FROM halls
  WHERE name = 'Hall 1'
  ORDER BY id
  LIMIT 1
)
WHERE hall_id IS NULL;

ALTER TABLE sessions
  MODIFY COLUMN hall_id INT NOT NULL;