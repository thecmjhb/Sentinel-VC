<p align="center"><img src="assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — বাংলা

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="README.md" title="English"><img src="assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="README.bn.md" title="বাংলা"><img src="assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="docs/i18n/README.zh-CN.md" title="中文"><img src="assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="docs/i18n/README.hi.md" title="हिन्दी"><img src="assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="docs/i18n/README.es.md" title="Español"><img src="assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="docs/i18n/README.ar.md" title="العربية"><img src="assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="docs/i18n/README.fr.md" title="Français"><img src="assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="docs/i18n/README.pt.md" title="Português"><img src="assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="docs/i18n/README.id.md" title="Bahasa Indonesia"><img src="assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="docs/i18n/README.ur.md" title="اردو"><img src="assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="docs/i18n/README.ru.md" title="Русский"><img src="assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="docs/i18n/README.ko.md" title="한국어"><img src="assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="docs/i18n/README.ja.md" title="日本語"><img src="assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="docs/i18n/README.de.md" title="Deutsch"><img src="assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="docs/i18n/README.tr.md" title="Türkçe"><img src="assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="docs/i18n/README.it.md" title="Italiano"><img src="assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="docs/i18n/README.fa.md" title="فارسی"><img src="assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="docs/i18n/README.vi.md" title="Tiếng Việt"><img src="assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="docs/i18n/README.ta.md" title="தமிழ்"><img src="assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="docs/i18n/README.te.md" title="తెలుగు"><img src="assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

## ব্যবহারের গাইড

[@sentinelvcbot](https://t.me/sentinelvcbot) · [আপডেট](https://t.me/sentinelvc)

/start → /language → বাংলা → /communities

Bot-কে group/channel admin করুন; supergroup-এ Restrict Members দিন। এখানে /communities খুলে নিজের community বেছে সেটআপ করুন। সব control এই private chat-এর button দিয়ে করুন। Private community-ও selector বা numeric ID দিয়ে যুক্ত হবে। সদস্য নিজের chat challenge পাবে /verify দিয়ে।

## আমার কমিউনিটি

**কমিউনিটি বাছুন → গ্রুপ / চ্যানেল → সেটআপ করুন → পর্যবেক্ষণ**

Public/private দুটোই: selector ব্যবহার করুন, অথবা /community -1001234567890 এর মতো numeric ID দিন। Public username-ও চলে।

Chat verification: private-এ /verify। Live-call mute admin review করে খুলবে। Bot প্রথমে নিজে থেকে inbox খুলতে পারে না।

**Voice account যুক্ত করুন → Login QR scan করুন → ভয়েস নিয়ন্ত্রণ → কলে join-burst প্রতিরক্ষা / প্রতি কলে আগাম মিউট**

নতুনদের muted entry করুন · Speaking admission খুলুন · সবার জন্য call শেষ করুন

Login QR scan করুন থেকে নিজের account যুক্ত করুন। QR অন্য screen-এ দেখিয়ে Telegram → Settings → Devices → Link Desktop Device দিয়ে scan করুন। 2FA থাকলে bot-এর নির্দিষ্ট private password প্রশ্নে Reply দিন। Website বা user-এর VPS access লাগে না। OTP/login code চাওয়া হয় না। Password transientভাবে ব্যবহার হয়; message মুছতে চেষ্টা করা হয়, তবে Telegram কপি থেকে যেতে পারে। VPS operator password/session access পেতে পারে। Bot account ID ও বর্তমান admin/Manage Call permission মিলিয়ে যাচাই করবে। বাতিল: /cancelvoice। বিচ্ছিন্ন: /disconnectvoice। 2FA বন্ধ করবেন না; account যুক্ত হলেই network attack বন্ধ হয় না।

[Private dashboard guide (English)](docs/PRIVATE_CONTROL.md)

## গ্রুপে যোগ করুন / চ্যানেল

[গ্রুপে যোগ করুন](https://t.me/sentinelvcbot?startgroup=setup) · [চ্যানেল](https://t.me/sentinelvcbot?startchannel&admin=manage_chat)

## VPS / Docker

[Self-hosting guide (English)](docs/SELF_HOSTING.md) · [Voice setup (English)](docs/VC_SETUP.md)

Use your own BotFather token for self-hosting. The public source does not require membership in @sentinelvc. Detailed diagnostics and operator documentation remain in English.

Experimental: local tests only; live Telegram validation is pending. Voice controls require the optional user-admin adapter. No raw UDP filtering, account-age detection or proven crash prevention.

[সোর্স কোড](https://github.com/thecmjhb/Sentinel-VC) · [MIT](LICENSE) · [Privacy (English)](PRIVACY.md)

C. M. Jubayer Hossain Bappy
