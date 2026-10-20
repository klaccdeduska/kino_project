-- Update existing kino database poster URLs (no table reset)
USE kino;

UPDATE movies SET poster_url = 'https://s3.amazonaws.com/nightjarprod/content/uploads/sites/189/2024/05/29150236/czembW0Rk1Ke7lCJGahbOhdCuhV-scaled.jpg' WHERE id = 1;
UPDATE movies SET poster_url = 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_.jpg' WHERE id = 2;
UPDATE movies SET poster_url = 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/4a/Oppenheimer_%28film%29.jpg/250px-Oppenheimer_%28film%29.jpg?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail' WHERE id = 3;
UPDATE movies SET poster_url = 'https://m.media-amazon.com/images/M/MV5BZjhkNjM0ZTMtNGM5MC00ZTQ3LTk3YmYtZTkzYzdiNWE0ZTA2XkEyXkFqcGc@._V1_.jpg' WHERE id = 4;
UPDATE movies SET poster_url = 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg' WHERE id = 5;
UPDATE movies SET poster_url = 'https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original' WHERE id = 6;
UPDATE movies SET poster_url = 'https://lumiere-a.akamaihd.net/v1/images/p_disneyplusoriginals_avatar_thewayofwater_poster_rebra_fa08636d.jpeg' WHERE id = 7;
UPDATE movies SET poster_url = 'https://m.media-amazon.com/images/M/MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA4Y2E0M2ZmXkEyXkFqcGc@._V1_.jpg' WHERE id = 8;
UPDATE movies SET poster_url = 'https://play-lh.googleusercontent.com/PhI5HgXUMHOIkvwvR7Ul2NvdbbTOHxSMprz9RTUxNOgYmNbm8t4JSLrM6bVBDNxP5Ijd4HFPo6pHZCSgwQo' WHERE id = 9;
UPDATE movies SET poster_url = 'https://upload.wikimedia.org/wikipedia/ru/archive/b/b2/20250325133255%21The_Batman_Poster.jpg' WHERE id = 10;
UPDATE movies SET poster_url = 'https://m.media-amazon.com/images/M/MV5BOWNmMzAzZmQtNDQ1NC00Nzk5LTkyMmUtNGI2N2NkOWM4MzEyXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg' WHERE id = 11;
UPDATE movies SET poster_url = 'https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p10488558_p_v12_ai.jpg' WHERE id = 12;

SELECT id, title, poster_url FROM movies ORDER BY id;
