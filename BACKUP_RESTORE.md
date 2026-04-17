# Backup & restore — what to do when things go wrong

This is a short runbook for the person who looks after the QInformX
installation. **Read it once, print it, tape it to the machine.**

## What runs automatically

A sidecar container named `backup` dumps the whole Mongo database every day
at **02:00 UTC** into the `backups/` folder next to `docker-compose.yml`.

- File naming: `qinformx-YYYY-MM-DDTHHMMSSZ.archive.gz`
- Retention: 14 most recent dumps; older ones are deleted to save disk
- Format: `mongodump --archive --gzip` (single compressed file per run)

**Recommended:** copy the `backups/` folder off the host periodically — to a
network share, S3 bucket, or USB drive. One disk failure shouldn't lose more
than yesterday.

## Manual backup (run anytime)

```bash
cd /path/to/qinformx
docker compose exec backup /backup.sh
ls -lh backups/
```

## Restore from a backup

> **Heads up:** this wipes the current database and replaces it with the
> contents of the archive. Do it in a maintenance window.

```bash
cd /path/to/qinformx

# 1. Pick the backup you want to restore (most recent by default)
BACKUP=$(ls -1t backups/qinformx-*.archive.gz | head -1)
echo "Restoring from $BACKUP"

# 2. Stop the app so nothing writes while we restore
docker compose stop app backup

# 3. Wipe the current 'qinformx' database
docker compose exec mongo mongosh qinformx --quiet --eval "db.dropDatabase()"

# 4. Restore the archive
docker compose exec -T mongo mongorestore --archive --gzip --nsInclude='qinformx.*' < "$BACKUP"

# 5. Bring things back up
docker compose up -d
```

Open the URL — everyone's tasks and history should be back.

## Sanity checks after a restore

- Sign in as admin.
- Open `/admin/users` — user count should match what you had before.
- Open `/applications` — counts should match.
- Open `/` as a normal user — their tasks should be back.
- If anything is off, the previous backup is still sitting in `backups/`
  and you can restore from that instead.

## Moving the whole installation to a different machine

1. `docker compose down` on the old machine.
2. Copy the entire install directory (including `backups/` and the Docker
   volumes directory — ask your ops team where Docker stores named volumes;
   usually `/var/lib/docker/volumes/`) to the new machine.
3. `docker compose up -d` on the new machine.
4. Users bookmark the new URL.

## If you lose even the backups

- QInformX is open source — the app code is safe on GitHub.
- A fresh install takes ~5 minutes. Users re-enter their current work.
- This is why **copying `backups/` off the host** is not optional for
  production use.
