#!/usr/bin/env bash

set -euo pipefail

docker compose exec -T db sh -c '
    export MYSQL_PWD="$MARIADB_ROOT_PASSWORD"
    exec mariadb-slap \
        --user=root \
        --host=127.0.0.1 \
        --port=3306 \
        "$@"
' mariadb-slap "$@"