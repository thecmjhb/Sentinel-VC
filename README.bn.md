<p align="center"><img src="assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — বাংলা

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="README.md" title="English"><img src="assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="README.bn.md" title="বাংলা"><img src="assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="docs/i18n/README.zh-CN.md" title="中文"><img src="assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="docs/i18n/README.hi.md" title="हिन्दी"><img src="assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="docs/i18n/README.es.md" title="Español"><img src="assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="docs/i18n/README.ar.md" title="العربية"><img src="assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="docs/i18n/README.fr.md" title="Français"><img src="assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="docs/i18n/README.pt.md" title="Português"><img src="assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="docs/i18n/README.id.md" title="Bahasa Indonesia"><img src="assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="docs/i18n/README.ur.md" title="اردو"><img src="assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="docs/i18n/README.ru.md" title="Русский"><img src="assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="docs/i18n/README.ko.md" title="한국어"><img src="assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="docs/i18n/README.ja.md" title="日本語"><img src="assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="docs/i18n/README.de.md" title="Deutsch"><img src="assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="docs/i18n/README.tr.md" title="Türkçe"><img src="assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="docs/i18n/README.it.md" title="Italiano"><img src="assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="docs/i18n/README.fa.md" title="فارسی"><img src="assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="docs/i18n/README.vi.md" title="Tiếng Việt"><img src="assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="docs/i18n/README.ta.md" title="தமிழ்"><img src="assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="docs/i18n/README.te.md" title="తెలుగు"><img src="assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

[Bot খুলুন](https://t.me/sentinelvcbot) · [Updates](https://t.me/sentinelvc)

Telegram supergroup-এর জন্য open-source moderation bot। এটি group join/leave, দ্রুত message ও button activity দেখে সাময়িক restriction দিতে পারে। নতুন সদস্যদের জন্য arithmetic verification এবং optional live-call state adapter আছে। Maintainer: **C. M. Jubayer Hossain Bappy**।

**অবস্থা:** experimental release। স্থানীয় automated tests হয়েছে; live Telegram ও Docker deployment validation বাকি। প্রথমে observe mode-এ আপনার group-এর স্বাভাবিক activity দেখে নিন।

## নিজের VPS ছাড়াই bot ব্যবহার

1. [@sentinelvcbot-কে supergroup-এ যোগ করুন](https://t.me/sentinelvcbot?startgroup=setup)।
2. Bot-কে admin করুন এবং **Restrict Members** permission দিন।
3. নিজের personal admin account থেকে `/setup`, তারপর কয়েক সেকেন্ড বিরতি দিয়ে `/doctor` ও `/status` পাঠান।
4. Observe mode-এ incident দেখে সন্তুষ্ট হলে `/mode enforce` দিন।
5. নতুন সদস্যদের verification চাইলে `/gate on` দিন।

এভাবে চালু থাকা project bot ব্যবহার করতে আপনার নিজস্ব VPS লাগবে না। Bot-এর availability hosting-এর ওপর নির্ভর করে। [@sentinelvc](https://t.me/sentinelvc)-তে updates পাবেন; Self-hosted code-এ channel join বাধ্যতামূলক নয়। Hosted project bot-এর private /start-এ channel join ও language ধাপ অনুসরণ করুন; restriction recovery-তে subscription লাগে না।

## কী কী পাবেন

- Cost-weighted token buckets এবং দ্রুত activity-র threat scoring।
- Group অনুযায়ী আলাদা settings, challenges, cooldowns ও audit records।
- মেয়াদযুক্ত restrictions এবং restricted user-এর private verification recovery।
- বর্তমান admin permissions যাচাই, admin immunity ও আগের restriction সংরক্ষণ।
- Optional user-admin adapter দিয়ে delivered live-call join/leave events ও অনুমোদিত mute actions।
- Docker setup helper, SQLite persistence, bounded queues ও health checks।

## প্রয়োজনীয় commands

| Command | কাজ |
|---|---|
| `/help`, `/updates`, `/privacy` | সাহায্য, project links ও data handling |
| `/setup`, `/doctor`, `/status` | Group enrollment, permissions ও settings |
| `/incidents` | বর্তমান group-এর সাম্প্রতিক incident records |
| `/mode observe` / `/mode enforce` | Audit-only / automatic moderation |
| `/gate on` / `/gate off` | নতুন member-এর verification |
| `/disable` | Group-এর protection settings বন্ধ |
| `/verify` | নিজের challenge আবার খুলুন |
| `/vc on`, `/vc off` | Configured voice adapter চালু/বন্ধ |

Configuration commands শুধু group-এর বর্তমান human admin ব্যবহার করতে পারবেন। Anonymous admin দিয়ে setup করা যায় না। [সম্পূর্ণ command list](README.md#commands) দেখুন।

## Verification কীভাবে করবেন

Restricted হয়ে group-এ message দিতে না পারলে bot-এর private chat খুলুন এবং `/verify GROUP_ID` পাঠান। Challenge-এ দেওয়া negative group ID ব্যবহার করুন। নিজের account-এর challenge-ই পাওয়া যাবে।

তিনবার ভুল উত্তর দিলে challenge শেষ হয়। Flood restriction-এর প্রথম এক মিনিটে verification দিয়ে মুক্ত হওয়া যায় না। Restriction-এর মেয়াদ শেষ হলে তা নিজে উঠে যায়; প্রয়োজন হলে group admin-এর সাহায্য নিন। Arithmetic challenge automation-ও solve করতে পারে।

## নিজের bot self-host করুন

নিজের BotFather token এবং Docker Engine/Compose-সহ Ubuntu VPS থাকলে:

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

Setup-এ VPS-এর health-check port বেছে নিতে পারবেন; নতুন default **18765**। Enter দিলে দেখানো port থাকবে। পরে বদলাতে `bash scripts/setup.sh --port 19234` দিন; অন্য `.env` settings অক্ষত থাকবে। npm দিয়ে চালালে `.env`-এর `HTTP_PORT` বদলান।

Helper token গোপনে চাইবে, নতুন `.env` তৈরি করবে এবং container চালাবে। বেছে নেওয়া port ছাড়া আগের configuration বদলাবে না। Token, `.env` ও account session private রাখুন।

Docker ছাড়া Node.js 24 LTS-এ:

```bash
cp .env.example .env
nano .env
npm ci --ignore-scripts
npm start
```

`.env`-এ `BOT_TOKEN` বসান। Windows-এ প্রথম command-এর বদলে `Copy-Item .env.example .env` ব্যবহার করুন। [Self-hosting guide](docs/SELF_HOSTING.md)-এ service, backup, update ও troubleshooting আছে।

## Voice-call controls ও সীমা

সাধারণ bot token দিয়ে raw UDP দেখা/বন্ধ করা, account-এর আসল creation date জানা বা সরাসরি live-call participant feed পাওয়া যায় না। Username না থাকা একা কাউকে punish করার কারণ নয়।

[Optional VC adapter](docs/VC_SETUP.md)-এর জন্য consenting user-admin account, private session ও explicit group allowlist দরকার। Call mute বা join-muted action group admin manually ফিরিয়ে দেবেন। Chat verification solve করলে live VC unmute হয় না। Packet flood blocking বা client crash prevention এই implementation প্রমাণ করেনি।

## সাহায্য ও license

[GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues)-এ সমস্যা জানান; [updates channel](https://t.me/sentinelvc)-এ খবর পাবেন। Bot-এর ভাষা নির্বাচন, onboarding ও guide ২০ ভাষায় আছে; moderation diagnostics English-এ থাকে। /language দিয়ে ভাষা বদলান।

Code [MIT license](LICENSE)-এর অধীনে। Reuse করলে copyright ও license রাখুন। [Privacy](PRIVACY.md), [security reporting](SECURITY.md) এবং [brand asset notice](assets/NOTICE.md) দেখুন।
