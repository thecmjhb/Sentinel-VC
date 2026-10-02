#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
sentinel_requested_port=''
if [[ $# -gt 0 ]]; then
  if [[ $# -ne 2 || "$1" != --port ]]; then
    printf '%s\n' 'Usage: bash scripts/setup.sh [--port 18765]'
    exit 1
  fi
  sentinel_requested_port="$2"
  if [[ ! "$sentinel_requested_port" =~ ^[1-9][0-9]{0,4}$ ]] || (( sentinel_requested_port > 65535 )); then
    printf '%s\n' 'Port must be an integer from 1 to 65535 (1024 or higher recommended).'
    exit 1
  fi
fi
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
  printf '%s\n' 'Using your existing .env; only the port changes if you select a new one.'
fi

# Let Compose parse .env safely; never execute it as shell code or print its secrets.
# The helper persists the choice in .env, rather than inheriting a shell override.
unset HTTP_PORT
sentinel_current_port="$(docker compose config --environment | awk '/^HTTP_PORT=/ { sub(/^HTTP_PORT=/, ""); print }')"
sentinel_current_port="${sentinel_current_port:-18765}"
sentinel_port="${sentinel_requested_port:-$sentinel_current_port}"
while true; do
  if [[ -t 0 && -z "$sentinel_requested_port" ]]; then
    read -r -p "VPS health-check port [$sentinel_port] (Enter to keep): " sentinel_answer
    sentinel_port="${sentinel_answer:-$sentinel_port}"
  fi
  sentinel_problem=''
  if [[ ! "$sentinel_port" =~ ^[1-9][0-9]{0,4}$ ]] || (( sentinel_port > 65535 )); then
    sentinel_problem='Port must be an integer from 1 to 65535.'
  else
    # A currently running container belonging to this project may keep its own port.
    sentinel_bound="$(docker compose port sentinel 8080 2>/dev/null || true)"
    if [[ "$sentinel_bound" != "127.0.0.1:$sentinel_port" ]] && command -v ss >/dev/null 2>&1; then
      sentinel_listeners="$(ss -H -ltn "sport = :$sentinel_port" 2>/dev/null || true)"
      if [[ -n "$sentinel_listeners" ]]; then
        sentinel_problem="Port $sentinel_port already has a TCP listener. Choose another port."
      fi
    fi
  fi
  [[ -z "$sentinel_problem" ]] && break
  printf '%s\n' "$sentinel_problem"
  if [[ ! -t 0 || -n "$sentinel_requested_port" ]]; then
    printf '%s\n' 'Retry with: bash scripts/setup.sh --port AVAILABLE_PORT'
    exit 1
  fi
  sentinel_port="$sentinel_current_port"
done

if [[ "$sentinel_port" != "$sentinel_current_port" ]]; then
  sentinel_env_tmp="$(mktemp .env.port.XXXXXX)"
  trap 'rm -f -- "$sentinel_env_tmp"' EXIT
  awk -v port="$sentinel_port" '
    /^[[:space:]]*(export[[:space:]]+)?HTTP_PORT[[:space:]]*[=:]/ { next }
    { print }
    END { print "HTTP_PORT=" port }
  ' .env > "$sentinel_env_tmp"
  chmod 600 "$sentinel_env_tmp"
  mv -- "$sentinel_env_tmp" .env
  trap - EXIT
fi
export HTTP_PORT="$sentinel_port"
docker compose config --quiet
if ! docker compose up -d --build; then
  printf '%s\n' "Startup failed. If port $sentinel_port is unavailable, rerun with --port and another number. Otherwise check the Docker error above."
  exit 1
fi
docker compose ps
printf '%s\n' '' 'Container started; allow startup time and check:' \
  "curl --fail http://127.0.0.1:$sentinel_port/readyz" \
  'docker compose logs --tail=50 sentinel' '' \
  'In Telegram: promote the bot with Restrict Members, then send /setup and /doctor.' \
  'Start in observe mode. Use /mode enforce after reviewing your group activity.' \
  'Updates: https://t.me/sentinelvc'
