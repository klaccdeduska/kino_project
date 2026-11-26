# Concurrent booking with Artillery

Artillery runs HTTP load tests and reports request rates, status counts and latency percentiles. This scenario tests whether MariaDB allows just one booking to claim a seat when multiple requests arrive together. See the [Artillery HTTP engine documentation](https://www.artillery.io/docs/reference/engines/http).

## Run locally

With Node.js 24 and Docker Desktop running, install the backend dependencies and run the scenario from the repository root.

```sh
npm --prefix backend ci
npm run test:booking-load
```

In PowerShell, use `npm.cmd` in the same commands if script execution is disabled. The runner downloads Artillery 2.0.34 through npm on first use. It creates an isolated Compose project named `kino-artillery` with MariaDB exposed at `127.0.0.1:3315`, builds the NestJS backend and starts the booking endpoint at `127.0.0.1:3105`. Use one test run at a time. The runner stops the API and prints the path to its JSON report.

Stop the database when finished. Compose keeps the seeded volume for later runs.

```sh
docker compose -p kino-artillery -f tests/load/artillery-compose.yaml down
```

## Scenario

The demo checkout stores purchases in the browser. In booking load mode, a dedicated NestJS route uses the project's MariaDB connection layer and cinema session schema. The fixture contains 10,000 screenings and 50,000 bookings. The runner clears only the target seat from the dedicated fixture before each run.

Twenty virtual users wait until all have arrived, then each sends one `POST` request for seat `A-1` of screening `1`. The API attempts a single `INSERT` per request. MariaDB enforces uniqueness with the primary key `(session_id, seat)`. One request should return HTTP `201 Created`, and 19 should return `409 Conflict`. The runner checks those counts and queries MariaDB for exactly one stored row for that seat.

## Results

Measured on 26 November 2026 on Windows with Artillery 2.0.34, Node.js 24.22.0 and MariaDB 11.8.9 in Docker.

| Metric | Run 1 | Run 2 |
| --- | ---: | ---: |
| Virtual users completed | 20 | 20 |
| HTTP requests | 20 | 20 |
| HTTP `201 Created` | 1 | 1 |
| HTTP `409 Conflict` | 19 | 19 |
| Unexpected responses or failed virtual users | 0 | 0 |
| Rows for the chosen seat after the test | 1 | 1 |
| Mean HTTP response time | 169.4 ms | 80.0 ms |
| p95 HTTP response time | 175.9 ms | 83.9 ms |
| Artillery whole-run request rate | 10 requests/s | 20 requests/s |

In both runs, the database accepted one booking and rejected the other 19 attempts. The API returned an explicit conflict for each rejected insert. Keep the unique key and duplicate-key handling when implementing persistent checkout. The p95 varied from 83.9 to 175.9 ms across the two short runs. To measure booking capacity, use a sustained run across different seats with a warm-up phase.
