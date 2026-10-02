#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  printf '%s\n' 'Install Docker Engine and its Compose plugin first:' 'https://docs.docker.com/engine/install/ubuntu/'
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  printf '%s\n' 'Docker is not reachable. Start Docker or run this script with an account allowed to use it.'
  exit 1
fi

if [[ ! -f .env ]]; then
  if [[ ! -t 0 ]]; then
    printf '%s\n' 'Open an interactive terminal, or create .env from .env.example and set BOT_TOKEN privately.'
    exit 1
  fi
  read -r -s -p 'Paste your BotFather token (hidden): ' sentinel_token
  printf '\n'
  if [[ ! "$sentinel_token" =~ ^[0-9]+:[A-Za-z0-9_-]{20,}$ ]]; then
    unset sentinel_token
    printf '%s\n' 'Token format is invalid. No .env was created.'
    exit 1
  fi
  # Exclude runtime secrets from shell tracing, command arguments and Docker build context.
  while IFS= read -r sentinel_line || [[ -n "$sentinel_line" ]]; do
    if [[ "$sentinel_line" == BOT_TOKEN=* ]]; then
      printf 'BOT_TOKEN=%s\n' "$sentinel_token"
    else
      printf '%s\n' "$sentinel_line"
    fi
  done < .env.example > .env
  unset sentinel_token sentinel_line
  chmod 600 .env
else
  printf '%s\n' 'Using your existing .env without changing it.'
fi

docker compose config --quiet
docker compose up -d --build
docker compose ps
printf '%s\n' '' 'Container started; allow startup time and check:' \
  'curl --fail http://127.0.0.1:8080/readyz' \
  'docker compose logs --tail=50 sentinel' '' \
  'In Telegram: promote the bot with Restrict Members, then send /setup and /doctor.' \
  'Start in observe mode. Use /mode enforce after reviewing your group activity.' \
  'Updates: https://t.me/sentinelvc'
