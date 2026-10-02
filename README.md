<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.png">
    <img src="assets/logo-light.png" alt="Sentinel-VC" width="520">
  </picture>
  <h3>Telegram moderation. Recoverable restrictions. Optional voice controls.</h3>
  <p>An open-source Telegram moderation framework by <strong>C. M. Jubayer Hossain Bappy</strong>.</p>
  <p>
    <a href="https://t.me/sentinelvcbot"><img src="https://img.shields.io/badge/Telegram-Open_bot-229ED9?logo=telegram&logoColor=white" alt="Open @sentinelvcbot"></a>
    <a href="https://t.me/sentinelvc"><img src="https://img.shields.io/badge/Telegram-Join_updates-229ED9?logo=telegram&logoColor=white" alt="Join project updates"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/Code-MIT-22c55e" alt="Code license MIT"></a>
    <img src="https://img.shields.io/badge/Documentation-10_languages-2563eb" alt="Documentation in 10 languages">
    <img src="https://img.shields.io/badge/Node.js-22.13%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22.13 or newer">
    <img src="https://img.shields.io/badge/Status-Experimental-f59e0b" alt="Experimental implementation">
  </p>
  <p><a href="#use-the-project-bot">Use the bot</a> · <a href="#host-your-own-bot">Self-host</a> · <a href="#commands">Commands</a> · <a href="#community-and-license">Community</a></p>
</div>

---

## Languages

[English](README.md) · [中文](docs/i18n/README.zh-CN.md) · [हिन्दी](docs/i18n/README.hi.md) · [Español](docs/i18n/README.es.md) · [العربية](docs/i18n/README.ar.md)

[Français](docs/i18n/README.fr.md) · [বাংলা](README.bn.md) · [Português](docs/i18n/README.pt.md) · [Bahasa Indonesia](docs/i18n/README.id.md) · [اردو](docs/i18n/README.ur.md)

## Start here

Sentinel-VC watches supported group events, scores rapid activity, and applies temporary, recoverable moderation. The optional user-admin adapter adds delivered voice-call join/leave events and authorized call actions.

**Status:** experimental release with local automated tests. Live Telegram behavior and Docker deployment still need validation. Start in observe mode and check your community before enabling enforcement.

## Use the project bot

Open **[@sentinelvcbot](https://t.me/sentinelvcbot)**. For an available bot instance:

1. [Add it to a supergroup](https://t.me/sentinelvcbot?startgroup=setup).
2. Promote it to administrator and grant **Restrict Members**.
3. From your human administrator account, send `/setup`, wait a few seconds, then `/doctor`.
4. Observe your community first. Use `/mode enforce` when ready for automatic temporary restrictions.
5. Optionally use `/gate on` for new-member arithmetic verification.

Join **[t.me/sentinelvc](https://t.me/sentinelvc)** for updates. Channel membership is optional and never required to solve a challenge. Adding the bot alone does not enable direct live-call control.

## Why Sentinel-VC

| Feature | What you get |
|---|---|
| Cost-weighted token buckets | Separate ordinary/voice-state budgets and decaying exceedance evidence |
| Multi-group hosting | Group-scoped enrollment, settings, challenges, cooldowns and audit records |
| Recoverable moderation | Native restriction expiry, user-bound buttons and private challenge recovery |
| Permission preservation | Fresh authority checks, admin immunity, preservation of existing restrictions |
| Optional voice adapter | Consenting user-admin, allowlist, participant transitions, mute and opt-in join-muted |
| Easy operation | Hidden-token setup helper, English/Bangla command menus, `/doctor` and `/incidents` |
| Bounded runtime | Limited queue, TTL/entry limits, API budgets, graceful stop and SQLite persistence |
| Offline benchmarks | Seeded event replay, policy baselines and JSON/CSV output |

## What Telegram lets this project do

| Capability | Bot token | Optional user-admin adapter |
|---|:---:|:---:|
| Group membership events and rapid messages/buttons | ✓ | Same bot engine |
| Temporary **chat** restriction and verification | ✓ | Same chat gate |
| Delivered live-call join/leave transitions | — | ✓, within available update coverage |
| Mute a current live-call user participant | — | ✓, with current rights |
| Change an active call to join-muted following detection | — | ✓, opt-in policy |
| Trustworthy account creation date | — | — |
| Raw UDP attribution/filtering or proven client-crash prevention | — | — |

Voice notes, call invitations and live-call participation are different events. Missing usernames are weak context, never a reason to punish someone alone. The adapter skips channel-identity peers and does not attribute moderator-caused mute changes to participants. See [the capability model](docs/ARCHITECTURE.md).

## Host your own bot

### Docker on your Ubuntu VPS

Create your bot with [BotFather](https://t.me/BotFather), install Docker Engine and the Compose plugin using [Docker's official guide](https://docs.docker.com/engine/install/ubuntu/), then run:

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

The setup helper asks for the token **without showing it**, creates a private `.env` if absent, preserves existing configuration, and starts the container. Keep the token private.

Check startup:

```bash
docker compose logs --tail=50 sentinel
curl --fail http://127.0.0.1:8080/readyz
```

Then configure the bot in Telegram. Polling needs no domain or public web port. See [self-hosting](docs/SELF_HOSTING.md) for manual setup and troubleshooting.

### npm without Docker

Install Node.js 24 LTS; Node.js 22.13+ is supported.

```bash
cp .env.example .env
nano .env
npm ci --ignore-scripts
npm start
```

Set `BOT_TOKEN` in `.env`. On Windows use `Copy-Item .env.example .env` and edit it in a text editor. For restart after logout/reboot, follow [persistent service setup](docs/SELF_HOSTING.md#keep-it-running). Run one polling process per token/database; replicas are unsupported.

### Optional direct voice controls

Read [VC setup](docs/VC_SETUP.md). A separate consenting user account, API credentials, private session and group allowlist are required. The account needs current call-management rights, and each group's human admin enables `/vc on`.

Do not upload sessions. Live-call mutes/join-muted settings require manual admin restoration. Solving a chat challenge does not unmute a live call. This adapter changes call state; it does not filter UDP traffic.

## Commands

| Command | Access | Purpose |
|---|---|---|
| `/start`, `/help`, `/updates`, `/privacy` | Anyone | Setup, commands, project links and data handling |
| `/setup` | Current supergroup admin | Enroll the group and check restriction rights |
| `/doctor` | Current supergroup admin | Check setup, permissions and adapter coverage |
| `/status` | Current supergroup admin | Show group ID and settings |
| `/incidents` | Current supergroup admin | Last ten retained incident records in this group |
| `/mode observe` / `/mode enforce` | Current supergroup admin | Audit only / enable bounded moderation |
| `/gate on` / `/gate off` | Current supergroup admin | Toggle new-member chat challenge |
| `/vc on` / `/vc off` | Current supergroup admin | Toggle configured voice-state adapter |
| `/vclock on` / `/vclock off` | Current supergroup admin | Toggle join-muted action for future detections |
| `/disable` | Current supergroup admin | Remove this group's protection settings |
| `/verify` | Challenged user | Recover own challenge in the group |
| `/verify GROUP_ID` in bot private chat | Challenged user | Recover own challenge while chat-restricted |

`GROUP_ID` is the negative ID printed in the original challenge. Allow a few seconds between admin commands. Anonymous admins cannot configure protection. Three incorrect answers exhaust a challenge; flood restrictions cannot be lifted in the first minute. Restrictions expire after the configured duration. Arithmetic is practical friction and can be automated.

## Develop and reproduce

```bash
npm ci --ignore-scripts
npm run check
npm test
npm audit --omit=dev
npm run benchmark
npm run benchmark:queue
npm run benchmark:sensitivity
```

Offline benchmarks generate local events and transmit no attack traffic. See [benchmarks](benchmarks/README.md) for outputs and measurement limits.

## Project map

```text
index.js                 Commands, polling and lifecycle
botPresentation.js       Scoped menus and project buttons
antiFlood.js              Token buckets and threat scoring
securityEngine.js         Moderation and verification
store.js                  SQLite settings, cooldowns and audit
voiceAdapter.js           Optional call-state integration
runtime.js                Queue, budgets and redacted logging
httpServer.js             Health, readiness and protected metrics
scripts/setup.sh          Private-token Docker setup helper
docs/                     User guides, capabilities and translations
benchmarks/               Local event replay and queue simulation
assets/                   Owner-supplied logos
test/                     Behavioral tests
```

## Community and license

- **Bot:** [@sentinelvcbot](https://t.me/sentinelvcbot)
- **Updates:** [@sentinelvc](https://t.me/sentinelvc)
- **Maintainer:** [thecmjhb](https://github.com/thecmjhb)
- **Code:** MIT; retain copyright and license when reusing it.
- **Brand assets:** [assets/NOTICE.md](assets/NOTICE.md).
- **Software citation:** [CITATION.cff](CITATION.cff).
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md). Vulnerabilities: [SECURITY.md](SECURITY.md).
- **Moderation data:** [PRIVACY.md](PRIVACY.md). [Dependabot](.github/dependabot.yml) prepares dependency-update PRs once enabled; it does not automatically deploy them.

Sentinel-VC is an independent project and is not affiliated with Telegram.
