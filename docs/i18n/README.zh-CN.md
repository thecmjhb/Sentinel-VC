<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — 中文

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="../../README.md" title="English"><img src="../../assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="../../README.bn.md" title="বাংলা"><img src="../../assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="README.zh-CN.md" title="中文"><img src="../../assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="README.hi.md" title="हिन्दी"><img src="../../assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="README.es.md" title="Español"><img src="../../assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="README.ar.md" title="العربية"><img src="../../assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="README.fr.md" title="Français"><img src="../../assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="README.pt.md" title="Português"><img src="../../assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="README.id.md" title="Bahasa Indonesia"><img src="../../assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="README.ur.md" title="اردو"><img src="../../assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="README.ru.md" title="Русский"><img src="../../assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="README.ko.md" title="한국어"><img src="../../assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="README.ja.md" title="日本語"><img src="../../assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="README.de.md" title="Deutsch"><img src="../../assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="README.tr.md" title="Türkçe"><img src="../../assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="README.it.md" title="Italiano"><img src="../../assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="README.fa.md" title="فارسی"><img src="../../assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="README.vi.md" title="Tiếng Việt"><img src="../../assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="README.ta.md" title="தமிழ்"><img src="../../assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="README.te.md" title="తెలుగు"><img src="../../assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

## 研究预印本

**[Sentinel-VC: Capability-Aware Event-Driven Moderation for Telegram Communities and Voice-Call State](https://zenodo.org/records/23165817)**

C. M. Jubayer Hossain Bappy · 2026-10-05 · [DOI: 10.5281/zenodo.23165817](https://doi.org/10.5281/zenodo.23165817) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

本文尚未经过同行评审。评估使用合成工作负载；尚未证明实际 Telegram 通话的音频恢复或崩溃防护效果。Zenodo 提供 PDF 和 LaTeX 源文件。

首次公开发布。作者和一名外部测试者报告使用成功；测试者按照 README 在 VPS 上部署，并在自己的频道中使用。实际响应时间尚未测量。

## 使用指南

[@sentinelvcbot](https://t.me/sentinelvcbot) · [更新](https://t.me/sentinelvc)

/start → /language → 中文 → /communities

将机器人设为群组或频道管理员；超级群组需要限制成员权限。在私聊中打开 /communities，选择社区并设置，用按钮管理。私有社区也可通过选择器或数字 ID 添加。成员通过 /verify 恢复自己的聊天验证。

## 我的社区

**选择社区 → 群组 / 频道 → 设置 → 观察**

Private/public: use the selector, or /community NEGATIVE_ID (for example /community -1001234567890). Public usernames also work.

Chat verification: /verify privately. Live-call mutes require administrator review. Bots cannot initiate private chats.

**连接语音账号 → 扫描登录二维码 → 语音控制 → 加入突发防护 / 每通通话预防**

新加入者静音 · 开放发言准入 · 结束所有人的通话

Press Scan login QR to connect YOUR account directly here. Scan with Telegram Settings → Devices → Link Desktop Device, showing the QR on another screen. If Telegram requires 2FA, reply with your password only to the active private password question. No website or user VPS access is needed. OTP/login codes are not requested. Password replies are processed transiently and deletion is attempted; Telegram copies may remain. This VPS operator can access your password/session. Your account ID and current admin/Manage Call rights are checked automatically. Cancel: /cancelvoice. Disconnect: /disconnectvoice. Keep 2FA enabled; call/network protection remains unproven.

[Private dashboard guide (English)](../PRIVATE_CONTROL.md)

## 添加到群组 / 频道

[添加到群组](https://t.me/sentinelvcbot?startgroup=setup) · [频道](https://t.me/sentinelvcbot?startchannel&admin=manage_chat)

## VPS / Docker

[Self-hosting guide (English)](../SELF_HOSTING.md) · [Voice setup (English)](../VC_SETUP.md)

Use your own BotFather token for self-hosting. The public source does not require membership in @sentinelvc. Detailed diagnostics and operator documentation remain in English.

Voice controls require the optional user-admin adapter. The service moderates supported events and call state; raw UDP filtering and account creation dates are outside its API coverage.

[源代码](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
