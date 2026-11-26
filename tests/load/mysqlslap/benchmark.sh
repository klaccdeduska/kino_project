#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for scenario in without-index with-index; do
    echo "======================================"
    echo "Scenario: $scenario"
    echo "======================================"

    bash "$SCRIPT_DIR/run.sh" \
        --create-schema=kino_benchmark \
        --no-drop \
        --concurrency=1,10,50,100 \
        --iterations=5 \
        --number-of-queries=1000 \
        --query="$(cat "$SCRIPT_DIR/$scenario.sql")"
done