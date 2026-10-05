# Private group and channel controls

1. Make your deployed bot an administrator in your supergroup or broadcast channel. Public and private communities both work. Supergroups need **Restrict Members**. Basic groups must become supergroups first.
2. Open the bot privately, choose your language, and press **My communities** (`/communities`).
3. Choose a community. A delivered bot-promotion update can remember it for the verified administrator who performed the promotion. The bot cannot enumerate all chats on your Telegram account.
4. If missing, press **Select community** → **Group** or **Channel**. Telegram shows matching chats, including private chats without usernames. The bot independently verifies both administrators' current permissions.
5. Press **Set up**. Start in **Observe**. Review **Incidents** before enabling **Enforce**. Supergroups have a **Verification** toggle. **Voice controls** and **Join muted** require [operator configuration](VC_SETUP.md).

The panel displays the numeric ID. Other administrators and older communities use the selector. If unavailable in an old Telegram client, update the client or supply a known authorized ID: `/community -1001234567890`. Public `@username` targets also work. An invite link and a linked discussion group's ID are not substitutes for the channel's own ID.

All commands, controls and bot messages are private. Public commands are ignored. Each button is bound to its administrator. Sensitive reads and changes recheck current permissions; revoked access removes that administrator's saved listing. The list is a convenience, not an authorization cache. Retry after a few seconds if API action budgets are exhausted.

## Member verification

After a bounded supergroup chat restriction succeeds, the bot attempts private delivery. **Ordinary bots cannot initiate private conversations.** If the member has never opened the bot, blocked it or delivery fails, there is no public fallback. The challenge remains recoverable and the native restriction expiry still applies.

Ask members to open the bot before protected activity. A restricted member opens `/start` or `/verify` to see their active verification list without knowing the group ID. Recovery remains available without joining the hosted project's updates channel.

Tasks randomly use addition, subtraction, multiplication, missing operands, largest-number or smallest-number questions, with random values and shuffled answer positions. Tokens are fresh, expiring and bound to community/member. Three wrong answers exhaust a challenge. Flood restrictions have a one-minute minimum before verification can restore permissions. These text/math tasks remain automatable; variety does not establish proof of humanity.

Solving restores only this bot's matching temporary **chat** restriction. Existing moderator restrictions are preserved. Disabling protection does not immediately lift active restrictions; they keep their original expiry.

## Live-call actions

The private panel also offers **Connect voice account**, **Raid shield**, **Guard each call**, **Rotate speaking links**, **Protect call now** and **Open admission**. See [the voice setup guide](VC_SETUP.md). Automatic admission changes require Enforce mode; confirmed manual controls are explicit requests. The shield responds to collective delivered join bursts rather than requiring every identity to exceed its own bucket. It does not ban a crowd or establish which users are malicious.

Broadcast subscribers do not receive supergroup CAPTCHA restrictions. With the optional adapter, delivered user-identity call events may trigger an authorized mute. The bot attempts a private notification after an acknowledged user mute; inbox delivery is conditional. An administrator restores speaking rights **in Telegram's call interface**. There is no automatic live-call unmute, permanent ban/unban workflow or complete hidden-listener feed. The dashboard controls protection policy; it does not replace every Telegram admin function.

No raw UDP measurement or guaranteed crash prevention is provided. Sources: [Telegram bot limitations](https://core.telegram.org/bots#how-are-bots-different-from-users), [chat selector](https://core.telegram.org/bots/api#keyboardbuttonrequestchat).

## Connect your own voice account

Choose **Connect voice account → Scan login QR** after the operator enables QR support. Scan with the same account chatting privately with the bot; current admin and call-management rights are checked. `/disconnectvoice` detaches YOUR QR account everywhere, before any hosted subscription gate. 2FA users reply only to the active private password question; no website or user VPS access is needed. Deletion is attempted and copies may remain. Do not send OTP/login codes, unsolicited passwords or sessions. Cancel: /cancelvoice. See [VC setup](VC_SETUP.md).

**End call (everyone)** is an explicitly confirmed action disconnecting all participants. A join burst never triggers it automatically; replacement calls are protected by the captured call ID.
