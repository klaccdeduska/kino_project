# Database Load Testing with mysqlslap

## Author

Daniil Janot

## Tool Overview

mysqlslap (mariadb-slap) is a database load testing
tool that simulates concurrent database clients.

It measures the performance of SQL queries under
different levels of concurrency.

The tool reports:

- Average execution time
- Minimum execution time
- Maximum execution time
- Number of concurrent clients
- Number of queries per client

## Objective

The objective is to evaluate how a database index
affects cinema session lookup performance under
concurrent load.

The cinema application allows customers to browse
screenings for a selected movie. During popular
movie premieres, many customers may perform this
operation simultaneously.

## Test Environment

- Database: MariaDB 11.8.9
- Tool: mariadb-slap
- Environment: local Docker
- Operating system: Windows
- Terminal: UCRT64 Bash
- Benchmark database: kino_benchmark
- Benchmark table: benchmark_sessions

All tests were performed locally.

The production application database was not modified.

## Installation

The tool is already included in the MariaDB Docker
image used by the cinema project.

Start the database:

```bash
docker compose up -d db
```

Check the tool version:

```bash
bash tests/load/mysqlslap/run.sh --version
```

## Dataset

The benchmark uses a simplified version of the cinema
sessions table.

The dataset contains:

- 100,000 cinema sessions
- 500 movie IDs
- 10 hall IDs
- 3 languages
- 2 screening formats

Generate the benchmark dataset:

```bash
docker compose exec -T db sh -c 'export MYSQL_PWD="$MARIADB_ROOT_PASSWORD"; exec mariadb -u root' < tests/load/mysqlslap/seed.sql
```

Create the benchmark index:

```bash
docker compose exec -T db sh -c 'export MYSQL_PWD="$MARIADB_ROOT_PASSWORD"; exec mariadb -u root' < tests/load/mysqlslap/index.sql
```

## Test Scenarios

Two scenarios were tested using the same dataset.

### Scenario 1: Without Index

The query explicitly ignores the movie_id index.

```sql
SELECT id, movie_id, hall_id, starts_at
FROM benchmark_sessions
IGNORE INDEX (idx_sessions_movie_id)
WHERE movie_id = 250
ORDER BY starts_at;
```

### Scenario 2: With Index

The query allows MariaDB to use the movie_id index.

```sql
SELECT id, movie_id, hall_id, starts_at
FROM benchmark_sessions
WHERE movie_id = 250
ORDER BY starts_at;
```

## Benchmark Configuration

| Parameter | Value |
|---|---|
| Dataset size | 100,000 sessions |
| Concurrent clients | 1, 10, 50, 100 |
| Iterations | 5 |
| Queries per iteration | 1,000 |
| Scenarios | 2 |

## Running the Benchmark

Run both scenarios:

```bash
bash tests/load/mysqlslap/benchmark.sh
```

Save the output:

```bash
set -o pipefail
bash tests/load/mysqlslap/benchmark.sh 2>&1 | tee tests/load/mysqlslap/results.txt
```

## EXPLAIN Results

| Parameter | Without index | With index |
|---|---|---|
| Access type | ALL | ref |
| Index | NULL | idx_sessions_movie_id |
| Estimated rows | 100116 | 200 |
| Sorting | Using filesort | Using filesort |

Without the index, MariaDB performs a full table scan.

With the index, the estimated number of examined
rows decreases by approximately 99.8%.

## Benchmark Results

### Without Index

All execution times are in seconds.

| Clients | Average | Minimum | Maximum |
|---:|---:|---:|---:|
| 1 | 29.188 | 25.517 | 30.726 |
| 10 | 11.086 | 10.401 | 11.441 |
| 50 | 12.641 | 11.550 | 14.875 |
| 100 | 13.699 | 12.552 | 15.020 |

### With Index

| Clients | Average | Minimum | Maximum |
|---:|---:|---:|---:|
| 1 | 0.853 | 0.741 | 1.018 |
| 10 | 0.844 | 0.640 | 1.163 |
| 50 | 2.585 | 2.127 | 2.987 |
| 100 | 3.934 | 3.610 | 4.815 |

### Performance Comparison

| Clients | Without index (s) | With index (s) | Speedup |
|---:|---:|---:|---:|
| 1 | 29.188 | 0.853 | 34.22x |
| 10 | 11.086 | 0.844 | 13.14x |
| 50 | 12.641 | 2.585 | 4.89x |
| 100 | 13.699 | 3.934 | 3.48x |

The reported execution times represent the complete
batch of 1,000 queries, not individual query latency.

No errors were reported during the completed benchmark.

Raw results are available in
[results.txt](../../tests/load/mysqlslap/results.txt).

## Conclusion

The benchmark demonstrates that the movie_id index
significantly improves cinema session lookup performance.

With one client, the indexed query completed the
workload approximately 34 times faster.

With 100 concurrent clients, the indexed scenario
was approximately 3.48 times faster.

The EXPLAIN results also demonstrate that the index
reduces the estimated number of examined rows from
100,116 to 200.

Performance decreases at higher concurrency levels,
even when the index is enabled. This suggests that
additional concurrency overhead may become a bottleneck.

A possible future optimization is a composite index
on movie_id and starts_at, which may reduce sorting
overhead.

The results demonstrate the importance of database
indexes when many cinema customers search for movie
screenings simultaneously.

## Limitations

The benchmark uses synthetic data in an isolated
database based on the cinema project's sessions model.

It measures database performance rather than complete
API response times.

Individual query latency percentiles such as p95
were not measured.

The proposed composite index was not tested.

## References

- https://mariadb.com/kb/en/mariadb-slap/