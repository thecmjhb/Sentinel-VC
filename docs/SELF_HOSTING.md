# Self-host Sentinel-VC

Run your own bot with the same community features. You need a bot token from [BotFather](https://t.me/BotFather), a supported Ubuntu VPS with outbound HTTPS access, and Docker Engine with Compose or Node.js 24 LTS. No domain is required for polling.

## Docker setup

Install Docker using its [official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/). Then:

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

**Use your own bot:** create one with @BotFather and use its token. @sentinelvcbot is the optional hosted service, not a required identity or credential. Self-hosted menus use the bot identity returned by Telegram.

The helper asks for your token privately, creates `.env` if absent, then lets you choose a VPS health-check port. New installations suggest **18765**; press Enter to keep the displayed port. Existing settings are preserved unless you choose another port. Use your own BotFather token; keep `.env` and account sessions out of GitHub.

To change the port later, run `bash scripts/setup.sh --port 19234` (replace 19234 with your chosen available port). This updates only `HTTP_PORT` in `.env` and recreates the container. On Ubuntu, the helper checks for listening TCP sockets and asks again if the port is busy; Docker's final bind remains authoritative because availability can change. No port number is guaranteed to be unused. A running container from this same Compose project can keep its current port. Non-interactive runs preserve the configured port unless `--port` is provided.

`HTTP_PORT` selects the **VPS port** in Docker and the listener port with `npm start`. The container uses port 8080 internally, isolated from other containers and host services. The helper uses `.env` rather than a shell `HTTP_PORT` override; when using Compose manually, shell environment values take precedence ([Docker documentation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)).

For manual setup:

```bash
cp .env.example .env
chmod 600 .env
nano .env
docker compose up -d --build
```

Set `BOT_TOKEN` in `.env`. Leave `MT_ENABLED=false` for ordinary bot deployment. Configuration options are documented beside their defaults in [.env.example](../.env.example).

Check that it started:

```bash
docker compose ps
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

The bundled HTTP port is bound to host loopback. Readiness confirms polling started; open `/communities` privately to check configuration and optional VC coverage.

## Set up your group

1. Add your bot to a Telegram **supergroup** and promote it to admin with **Restrict Members**.
2. Open `/communities` privately. Choose your community and press **Set up**; use **Select community** if missing. Private numeric IDs are supported.
3. Begin in **Observe** mode. Review **Incidents** before enabling **Enforce**.
4. Enable **Verification** for new supergroup members. All commands and challenges stay private. See [private control](PRIVATE_CONTROL.md).

The optional [voice-call adapter](VC_SETUP.md) needs a separate consenting user-admin account. A bot token alone does not enable direct call monitoring or muting.

## Without Docker

Install Node.js 24 LTS (minimum 22.13), then:

```bash
cp .env.example .env
chmod 600 .env
nano .env
npm ci --ignore-scripts
npm start
```

On Windows, use `Copy-Item .env.example .env` and edit it with a text editor. Set `BOT_TOKEN` and an available `HTTP_PORT` before starting (default 18765). Check readiness at `http://127.0.0.1:YOUR_PORT/readyz`, replacing YOUR_PORT with that number. If Node reports EADDRINUSE, select another port in `.env` and restart. `npm start` stays attached to the terminal.

## Keep it running

Docker uses `restart: unless-stopped` to restart after a process exit or host reboot. Enable Docker at boot:

```bash
sudo systemctl enable --now docker
```

An unhealthy healthcheck does not itself restart the container. Investigate sustained readiness failures.

For npm, run under an unprivileged service account. The following systemd example assumes code in `/opt/sentinel-vc` and Node at `/usr/bin/node`; check `command -v node` and adjust `ExecStart` if needed.

```bash
sudo useradd --system --user-group --home-dir /opt/sentinel-vc --shell /usr/sbin/nologin sentinel
cd /opt/sentinel-vc
npm ci --ignore-scripts
sudo install -d -o sentinel -g sentinel -m 700 data
sudo chown sentinel:sentinel .env
sudo chmod 600 .env
```

Skip account creation if it already exists. Code must be readable by that account. Save this as `/etc/systemd/system/sentinel-vc.service`:

```ini
[Unit]
Description=Sentinel-VC Telegram moderation
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=sentinel
Group=sentinel
WorkingDirectory=/opt/sentinel-vc
ExecStart=/usr/bin/node /opt/sentinel-vc/index.js
Environment=NODE_ENV=production
Restart=on-failure
RestartSec=5
TimeoutStopSec=35
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/opt/sentinel-vc/data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sentinel-vc
sudo systemctl status sentinel-vc
```

Use one polling process per token and database. Stop any earlier Docker/npm instance before switching. Remove a previous webhook deliberately through that deployment's management interface; Sentinel-VC reports it instead of silently deleting it.

## Stop, back up and update

`docker compose stop sentinel` stops the service and preserves saved data. Back up the database while stopped, and store `.env` and optional sessions separately in encrypted storage.

```bash
docker compose stop sentinel
mkdir -p backups
docker compose run --rm --no-deps --user root --entrypoint sh -v "$(pwd)/backups:/backup" sentinel -c 'tar czf /backup/sentinel-data.tgz -C /app/data .'
docker compose start sentinel
```

For npm, stop the service and copy the entire `data/` directory, including WAL/SHM files if present. Test restoration before relying on backups.

This private-dashboard release migrates database schema 1 to 2 while preserving old settings and active challenges. Keep the stopped pre-upgrade snapshot: an older release requires both its matching code and the old database. Do not attempt an in-place schema downgrade.

After backup, review release changes and update a Git checkout:

```bash
git pull --ff-only
docker compose up -d --build
```

For npm, run `npm ci --ignore-scripts` after updating code and restart your service. Avoid `docker compose down -v` unless you intend to remove stored settings and audit records.

## Troubleshooting

| Problem | What to check |
|---|---|
| Bot cannot start | Token, `.env` values, outbound network access and logs |
| Port already allocated / EADDRINUSE | Docker: run `bash scripts/setup.sh --port 19234` with an available port. npm: edit `HTTP_PORT` in `.env` and restart. Do not stop unrelated services. |
| Polling conflict | Another process is using the same token |
| Setup fails | Open the bot privately; check current admin rights and Restrict Members for supergroups |
| No automatic action | Observe mode, admin immunity, cooldowns, thresholds and API budgets |
| Verification not received | Open the bot privately and send `/verify`; bots cannot initiate an inbox conversation |
| VC account unavailable | Session ownership, consent, allowlist, Manage Video Chats permission and `/vc on` |

For Docker, the optional session must be readable by container UID 1000; preserve file mode 600 and directory mode 700. For systemd, give the `sentinel` account equivalent private access. See [VC setup](VC_SETUP.md) for the full adapter procedure and manual restoration of call actions.
