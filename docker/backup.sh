#!/bin/sh
# Nightly MongoDB backup script. Runs from inside the `backup` sidecar
# container. Produces a timestamped archive into /backups and prunes
# anything older than 14 days.

set -eu

TS=$(date -u +"%Y-%m-%dT%H%M%SZ")
OUT=/backups/qinformx-${TS}.archive.gz

echo "[$(date -u +%FT%TZ)] starting backup -> ${OUT}"
mongodump --uri="mongodb://mongo:27017/qinformx" --archive="${OUT}" --gzip

# Retention: keep 14 most recent daily dumps.
ls -1t /backups/qinformx-*.archive.gz 2>/dev/null | tail -n +15 | xargs -r rm -f

echo "[$(date -u +%FT%TZ)] done. current backups:"
ls -lh /backups/qinformx-*.archive.gz 2>/dev/null || echo "  (none)"
