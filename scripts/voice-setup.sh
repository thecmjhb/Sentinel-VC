#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
if [[ -x .runtime/node/bin/node ]]; then export PATH="$PWD/.runtime/node/bin:$PATH"; fi
if ! command -v node >/dev/null 2>&1; then printf '%s\n' 'Install the bot first (Node.js 22.13+ required).'; exit 1; fi
exec node scripts/voice-setup.mjs "$@"
