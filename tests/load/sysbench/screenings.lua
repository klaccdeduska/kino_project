local connection

function thread_init()
  connection = sysbench.sql.driver():connect()
end

function event()
  local movie_id = sysbench.rand.uniform(1, 100)

  -- Match MoviesService.findSessions, including the hall join and ordering.
  connection:query(string.format([[
    SELECT
      s.id,
      s.movie_id AS movieId,
      DATE_FORMAT(s.starts_at, '%%Y-%%m-%%d') AS date,
      DATE_FORMAT(s.starts_at, '%%H:%%i') AS time,
      h.id AS hallId,
      h.name AS hallName,
      s.language,
      s.subtitles,
      s.format
    FROM sessions AS s
    JOIN halls AS h ON h.id = s.hall_id
    WHERE s.movie_id = %d AND s.starts_at > NOW()
    ORDER BY s.starts_at, s.id
  ]], movie_id))
end

function thread_done()
  connection:disconnect()
end
