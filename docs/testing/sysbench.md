# MariaDB load test with sysbench

[sysbench](https://github.com/akopytov/sysbench) runs a Lua workload with multiple concurrent workers and reports throughput, average and percentile latency, and SQL errors.

## Scenario

Each worker opens a MariaDB connection and repeatedly reads upcoming screenings for a uniformly selected film. The Lua script uses the SQL from [`MoviesService.findSessions`](../../backend/src/movies/movies.service.ts), including the hall join, the `NOW()` filter and chronological ordering. Each sysbench event is one read query, so the reported TPS and queries per second are equal. Event latency includes fetching the result over the container network.

The benchmark applies the project's cinema migrations and seeds 100 films, 10 halls and 100,000 screenings. Every film has 1,000 screenings. Roughly half are in the future, so the workload tests both filtering and returning several hundred rows per request. The runner prints the row counts and the `EXPLAIN` plan for film 50 before measuring.

## Run locally

Install Docker Desktop with Compose v2, start Docker, and run this from the repository root. The first run builds the sysbench image and initializes MariaDB.

```sh
docker compose -p kino-sysbench -f compose.sysbench.yaml run --build --rm sysbench
```

The benchmark starts its own MariaDB on an internal Docker network with no published ports. It stores benchmark data in a temporary filesystem. The application can stay stopped throughout.

The default run uses 1, 8 and 32 workers for 30 seconds each, with a 5-second warm-up per run. Pass the measured duration in seconds after the service name for a smoke test.

```sh
docker compose -p kino-sysbench -f compose.sysbench.yaml run --build --rm sysbench 2
```

Remove the benchmark database container and network when finished. The next start seeds a fresh database.

```sh
docker compose -p kino-sysbench -f compose.sysbench.yaml down
```

## Results

Measured on Windows with Docker Desktop (WSL 2), an Intel Core i5-10210U, and 8 logical CPUs and about 7.6 GiB of RAM visible to Docker. The run used sysbench 1.0.20 and MariaDB 11.8.9 with 100,000 screenings, including 49,940 upcoming screenings.

| Threads | TPS | Mean latency (ms) | p95 latency (ms) | Ignored errors | Reconnects |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 421.27 | 2.37 | 3.68 | 0 | 0 |
| 8 | 1,037.90 | 7.70 | 14.21 | 0 | 0 |
| 32 | 1,100.81 | 29.04 | 51.02 | 0 | 0 |

## Conclusion

From 8 to 32 threads, throughput increased by about 6% while p95 latency rose from 14.21 ms to 51.02 ms. The query was already approaching the throughput limit of this local setup at 8 workers. This was a single run against a local database with synthetic data.

For film 50, MariaDB used the `movie_id` index and estimated reading 1,000 session rows. The plan reported `Using where; Using filesort` for the session lookup. A composite index on `(movie_id, starts_at, id)` could let MariaDB skip past screenings and read future screenings in order. Its effect on throughput and latency remains to be measured.
