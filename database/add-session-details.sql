USE kino;

ALTER TABLE sessions
  ADD COLUMN language VARCHAR(50) NOT NULL DEFAULT 'English',
  ADD COLUMN subtitles VARCHAR(100) NULL,
  ADD COLUMN format VARCHAR(20) NOT NULL DEFAULT '2D';

UPDATE sessions
SET subtitles = 'Estonian, Russian';