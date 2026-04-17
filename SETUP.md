# SETUP — Running QInformX at your site

This guide is written for a non-engineer. If you can follow numbered steps and
copy-paste a command, you can get QInformX running.

## Before you start

You need **one Linux machine** (physical or VM, desktop-class is fine) with:

- Docker 24+ and Docker Compose (usually bundled as `docker compose`)
- At least 2 CPU, 4 GB RAM, 10 GB free disk
- A network address on your intranet (the team will use the browser to reach it)

No need for public internet access or a domain. QInformX is meant to live
behind your firewall.

> **Tip:** if you don't have Docker yet: on Ubuntu/Debian run `sudo apt install
> docker.io docker-compose-v2`. On RHEL/CentOS follow the official Docker docs.

## 1. Get the code onto the machine

```bash
git clone https://github.com/<your-org>/qinformx.git
cd qinformx
```

(If you don't have git, download and unzip the release tarball instead.)

## 2. Set a password-style secret

```bash
# any random string of 40+ characters
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
```

## 3. Bring everything up

```bash
docker compose up -d
```

This one command does the following:

1. Starts a MongoDB 7 database in the background
2. Builds the QInformX app (first run takes ~3 minutes, later runs are instant)
3. Starts a backup sidecar that snapshots the database every night at 02:00 UTC
   and keeps 14 days of history

Give it about 2 minutes the first time. Then open
<http://THIS-MACHINE-IP:3000> in a browser on the same network.

## 4. Create the first admin user

The very first account you register automatically becomes **admin**. Register
yourself first (you can use a personal-looking email — it never leaves the
server), then log in.

## 5. Tell the team the URL

Ask users to bookmark the URL. That's it — they sign in, nothing to install.

---

## Common operations

### Pull a new version

```bash
cd qinformx
git pull
docker compose up -d --build
```

### Restart everything (after a reboot, outage, etc.)

```bash
docker compose restart
```

Services have `restart: unless-stopped` so they come back by themselves after a
power cycle, too.

### Check status

```bash
docker compose ps
docker compose logs app --tail=200
```

### Stop everything

```bash
docker compose down
```

This keeps your data. To also wipe data, add `-v` (careful!).

---

## Backups — they just happen

Nightly archive-format dumps are written to the `backups/` folder inside the
install directory, with 14 day retention. You can (and should) **copy that
folder off the machine periodically** — USB drive, network share, S3, whatever
your org prefers. See `BACKUP_RESTORE.md` for the restore steps.

---

## Troubleshooting

- **Can't reach the URL** — check `docker compose ps` shows `app` as `running`,
  then try `curl -I http://localhost:3000/login` on the host itself.
- **Port 3000 is taken** — set `QINFORMX_PORT=8080` in `.env` and re-up.
- **Need to serve on port 80 or over TLS** — put nginx or Caddy in front
  proxying to `localhost:3000`.
- **First-time build is failing** — ensure the machine has 4 GB free RAM and
  internet (Docker needs to pull base images once).

---

## Security checklist (do this before real use)

1. Change `JWT_SECRET` in `.env` to a long random string. **Do not share it.**
2. Keep the service bound to the internal network only — no public ingress.
3. If you need HTTPS, front it with nginx/Caddy/your corporate gateway.
4. Make sure the backup folder is on a disk that's snapshotted or replicated.
5. Store the initial admin password in your company's password manager, not
   in a sticky note.
