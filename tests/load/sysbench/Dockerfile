FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends sysbench mariadb-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /bench
COPY screenings.lua run.sh ./
RUN sed -i 's/\r$//' run.sh
ENTRYPOINT ["sh", "/bench/run.sh"]
