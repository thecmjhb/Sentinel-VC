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
    <img src="https://img.shields.io/badge/Documentation-20_languages-2563eb" alt="Documentation in 20 languages">
    <img src="https://img.shields.io/badge/Node.js-22.13%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22.13 or newer">
    <img src="https://img.shields.io/badge/Status-Experimental-f59e0b" alt="Experimental implementation">
  </p>
  <p><a href="#use-the-project-bot">Use the bot</a> · <a href="#host-your-own-bot">Self-host</a> · <a href="#commands">Commands</a> · <a href="#community-and-license">Community</a></p>
</div>

---

## Languages

Choose a README language below. In Telegram, use `/language` for translated onboarding and guides. Moderation diagnostics and detailed operator docs remain in English.

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="README.md" title="English"><img src="assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="README.bn.md" title="বাংলা"><img src="assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="docs/i18n/README.zh-CN.md" title="中文"><img src="assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="docs/i18n/README.hi.md" title="हिन्दी"><img src="assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="docs/i18n/README.es.md" title="Español"><img src="assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="docs/i18n/README.ar.md" title="العربية"><img src="assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="docs/i18n/README.fr.md" title="Français"><img src="assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="docs/i18n/README.pt.md" title="Português"><img src="assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="docs/i18n/README.id.md" title="Bahasa Indonesia"><img src="assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="docs/i18n/README.ur.md" title="اردو"><img src="assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="docs/i18n/README.ru.md" title="Русский"><img src="assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="docs/i18n/README.ko.md" title="한국어"><img src="assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="docs/i18n/README.ja.md" title="日本語"><img src="assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="docs/i18n/README.de.md" title="Deutsch"><img src="assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="docs/i18n/README.tr.md" title="Türkçe"><img src="assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="docs/i18n/README.it.md" title="Italiano"><img src="assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="docs/i18n/README.fa.md" title="فارسی"><img src="assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="docs/i18n/README.vi.md" title="Tiếng Việt"><img src="assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="docs/i18n/README.ta.md" title="தமிழ்"><img src="assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="docs/i18n/README.te.md" title="తెలుగు"><img src="assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

## Start here

Sentinel-VC watches supported group events, scores rapid activity, and applies temporary, recoverable moderation. The optional user-admin adapter adds delivered voice-call join/leave events and authorized call actions.

**Status:** experimental release with local automated tests. Live Telegram behavior and Docker deployment still need validation. Start in observe mode and check your community before enabling enforcement.

## Use the project bot

Open **[@sentinelvcbot](https://t.me/sentinelvcbot)**. In private chat, follow the access prompt and choose your language. For an available bot instance:

1. Add the bot to your public or private supergroup or broadcast channel as an administrator.
2. For supergroups, grant **Restrict Members**. Basic groups must become supergroups first.
3. Open **My communities** (`/communities`) in the bot private chat. Choose your community → **Set up**. If missing, use **Select community**; private communities need no username. Numeric IDs also work: `/community -1001234567890`.
4. Use **Observe** first. Review **Incidents**, then enable **Enforce** using the buttons.
5. Optionally enable **Verification** for new supergroup members. Members recover challenges with `/verify` privately. All bot controls and messages stay in private chat.

Newly delivered promotion updates can add the community to the promoting administrator’s list. Other administrators and older communities use the selector or a known ID. The bot cannot enumerate all your Telegram chats. [Private control and recovery guide](docs/PRIVATE_CONTROL.md).

Join **[t.me/sentinelvc](https://t.me/sentinelvc)** for updates. The self-hosted source has no mandatory channel subscription. The hosted project bot displays its own channel-join step before menu access; challenge recovery remains available without subscription. Adding the bot alone does not enable direct live-call control.

## Why Sentinel-VC

Connect your account privately with **Connect voice account → Scan login QR**, after the operator enables QR support. The account must match your bot-chat account and have current call-management rights. Password-required accounts use local VPS login. [Connection guide](docs/VC_SETUP.md).

**Voice scope:** repeating join-muted when entry is already muted adds no new protection. These controls cannot be presented as a solution to connecting/audio failures caused by muted participants or hidden transport traffic. Admins can explicitly confirm **End call (everyone)** as disruptive containment. Real-world crash prevention remains unproven.

| Feature | What you get |
|---|---|
| Cost-weighted token buckets | Separate ordinary/voice-state budgets and decaying exceedance evidence |
| Multi-group hosting | Group-scoped enrollment, settings, challenges, cooldowns and audit records |
| Recoverable moderation | Native restriction expiry, user-bound buttons and private challenge recovery |
| Permission preservation | Fresh authority checks, admin immunity, preservation of existing restrictions |
| Optional voice adapter | Consenting user-admin, allowlist, participant transitions, mute and opt-in join-muted |
| Easy operation | Hidden-token setup helper, 20-language onboarding and private community controls |
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

The helper lets you choose the VPS health-check port (new default: **18765**). Press Enter to keep the displayed port. To change it later: `bash scripts/setup.sh --port 19234`. Other `.env` settings are preserved. For npm, set `HTTP_PORT` in `.env`.

The setup helper asks for the token **without showing it**, creates a private `.env` if absent, preserves other existing configuration, and starts the container. Keep the token private.

Check startup:

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
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

Set `BOT_TOKEN` in `.env` to **your own bot’s BotFather token**. No @sentinelvcbot token or membership in our updates channel is required for self-hosting. Menus use your deployed bot’s username automatically. On Windows use `Copy-Item .env.example .env` and edit it in a text editor. For restart after logout/reboot, follow [persistent service setup](docs/SELF_HOSTING.md#keep-it-running). Run one polling process per token/database; replicas are unsupported.

### Optional direct voice controls

Hosted and self-hosted bots support separately bound administrator QR accounts with encrypted local sessions. Operator setup: `bash scripts/voice-setup.sh --qr`, then restart. `/disconnectvoice` removes your QR account. Local terminal login remains available; see the guide for 2FA and account-access implications.

**Voice protection:** connect a consenting user-admin account with `bash scripts/voice-setup.sh`, then use **Voice controls**, **Raid shield**, **Guard each call** and **Protect call now** in the private panel. The collective shield detects a burst of distinct delivered call joins as well as the existing individual-churn detector. In Enforce it constrains speaking admission without automatically blaming each joining user. Optional invitation-hash rotation limits old speaking-link bypass. [Account connection and protection guide](docs/VC_SETUP.md#easy-account-connection--npm--pm2).

Read [VC setup](docs/VC_SETUP.md). A separate consenting user account, API credentials, private session and numeric supergroup/channel allowlist are required. The account needs current call-management rights. A community admin enables **Voice controls** in the private panel, or uses `/community TARGET vc on` privately.

Do not upload sessions. Live-call mutes/join-muted settings require manual admin restoration. Solving a chat challenge does not unmute a live call. This adapter changes call state; it does not filter UDP traffic.

### Broadcast channel voice chat

Add your deployed bot as channel admin. In its **private chat**, use `/communities` → **Select community** → **Channel** → **Set up**. Private channels need no username. A known ID also works with `/community NEGATIVE_ID`. The operator must configure the optional MTProto user-admin adapter and allowlist the displayed numeric ID before enabling **Voice controls**. Start in Observe. [Complete channel setup](docs/VC_SETUP.md#channel-administration-in-private).

Normal non-RTMP channel calls and supergroup calls are supported for delivered user-identity transitions. Subscriber CAPTCHA is not a channel feature. Hidden listeners, channel participant identities and raw UDP are not covered.

## Commands — private chat only

| Command | Purpose |
|---|---|
| `/start`, `/help`, `/language` | Onboarding and 20-language selection |
| `/communities` | Your verified community list and control buttons |
| `/community TARGET` | Open a group/channel by numeric ID or public username |
| `/community TARGET setup` | Enroll after fresh human and bot admin checks |
| `/community TARGET status` / `incidents` | Settings or retained incidents |
| `/community TARGET mode observe` / `mode enforce` | Observe or enforce |
| `/community TARGET gate on` / `gate off` | Supergroup verification |
| `/community TARGET vc on` / `vc off` | Optional allowlisted voice adapter |
| `/community TARGET vclock on` / `vclock off` | Join-muted policy for future detections |
| `/community TARGET disable` | Disable protection; existing restrictions keep their expiry |
| `/verify` or `/verify NEGATIVE_ID` | Recover your own active chat challenge |
| `/disconnectvoice` | Detach your QR user account from all bound communities and attempt logout |
| `/updates`, `/privacy` | Project links and data handling |

Buttons are the easiest path. `TARGET` accepts a negative numeric ID or public `@username`; invite links are not IDs. `/group TARGET ...` and `/channel TARGET ...` are type-checked aliases. Legacy action commands work privately with an explicit target, e.g. `/status -1001234567890`.

Verification selects among six arithmetic/number-ordering families, randomizes values and answer placement, and binds challenges to a user, community, nonce and expiry. Three wrong answers exhaust a challenge; flood restrictions cannot be lifted in the first minute. These tasks remain automatable. Bots cannot initiate private conversations: failed delivery preserves `/start` or `/verify` recovery and native restriction expiry. **Chat verification never grants live-call speaking rights.** Call mutes require administrator review in Telegram.

## Develop and reproduce

```bash
npm ci --ignore-scripts
npm run check
npm test
npm audit --omit=dev
npm run benchmark
npm run benchmark:queue
npm run benchmark:sensitivity
npm run benchmark:voice
```

Offline benchmarks generate local events and transmit no attack traffic. See [benchmarks](benchmarks/README.md) for outputs and measurement limits.

## Project map

```text
index.js                 Commands, polling and lifecycle
botPresentation.js       Scoped menus and project buttons
antiFlood.js              Token buckets and threat scoring
securityEngine.js         Moderation and verification
store.js                  SQLite settings, cooldowns and audit
voiceAdapter.js           Optional group/channel call-state integration
dashboard.js              Private group/channel list and verified controls
recovery.js               Private challenge retrieval
challenges.js             Six randomized challenge families
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
