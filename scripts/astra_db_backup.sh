#!/bin/bash
# Copyright (c) 2026 MiraNova Studios
# Backup the Astra database to a gzipped file with date stamp.
# Reads DB_PATH from the .env file in the project root (one level up from scripts/).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE" >&2
  exit 1
fi

DB_PATH=$(grep -E '^DB_PATH=' "$ENV_FILE" | cut -d '=' -f 2-)

if [ -z "$DB_PATH" ]; then
  echo "Error: DB_PATH not set in $ENV_FILE" >&2
  exit 1
fi

if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database file not found at $DB_PATH" >&2
  exit 1
fi

BACKUP_DIR="$(dirname "$DB_PATH")"
DATE=$(date +%Y%m%d)
BACKUP_FILE="$BACKUP_DIR/astra.db-${DATE}.gz"

# Copy and gzip
cp "$DB_PATH" "$BACKUP_DIR/astra.db-${DATE}"
gzip -f "$BACKUP_DIR/astra.db-${DATE}"

echo "Backup created: $BACKUP_FILE"
