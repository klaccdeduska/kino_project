#!/bin/sh
set -eu

duration=${1:-30}
case "$duration" in
  ''|*[!0-9]*|0) echo "Usage: run.sh [positive seconds per run]" >&2; exit 2 ;;
esac
if [ "$duration" -lt 1 ] || [ "$#" -gt 1 ]; then
  echo "Usage: run.sh [positive seconds per run]" >&2
  exit 2
fi

export MYSQL_PWD=sysbench_local
sysbench --version
mariadb --host=db --user=kino_bench kino_bench <<'SQL'
SELECT VERSION() AS mariadb_version,
       (SELECT COUNT(*) FROM movies) AS movies,
       (SELECT COUNT(*) FROM halls) AS halls,
       COUNT(*) AS screenings,
       SUM(starts_at > NOW()) AS upcoming_screenings
FROM sessions;

EXPLAIN
SELECT s.id, s.movie_id, DATE_FORMAT(s.starts_at, '%Y-%m-%d'),
       DATE_FORMAT(s.starts_at, '%H:%i'), h.id, h.name, s.language, s.subtitles, s.format
FROM sessions AS s
JOIN halls AS h ON h.id = s.hall_id
WHERE s.movie_id = 50 AND s.starts_at > NOW()
ORDER BY s.starts_at, s.id;
SQL

for threads in 1 8 32; do
  printf '\n%s threads, %s measured seconds\n' "$threads" "$duration"
  sysbench /bench/screenings.lua \
    --db-driver=mysql --mysql-host=db --mysql-user=kino_bench \
    --mysql-password="$MYSQL_PWD" --mysql-db=kino_bench \
    --threads="$threads" --time="$duration" --warmup-time=5 \
    --report-interval=5 --percentile=95 --rand-seed=42 run
done
