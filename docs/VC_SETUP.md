# Voice calls in supergroups and broadcast channels

Ordinary deployment uses the bot token only. Direct voice-call state monitoring requires a separate consenting **user** admin account because Telegram's call-management methods are user-only. The optional adapter uses `teleproto`, a maintained GramJS-compatible MTProto client; the pinned `telegram` package was deprecated at the time of implementation. See [migration documentation](https://docs.teleproto.dev/migrating-from-gramjs).

This account has normal user-session access. Account connection starts in the private bot panel when QR support is enabled. Telegram requires the account holder to scan and accept login; this is authentication, not a separate permission request to the project author. Phone-code/password login stays local to the account holder's VPS.

## Connect your account from the bot

The hosted master and self-hosted bots use the same QR flow. Each administrator connects their own account, matching the Telegram account chatting with the bot. The operator configures API credentials and an encryption key once; community users need no API credentials or terminal access for supported QR logins.

1. Add the bot as community administrator, open `/communities` privately, select the public/private supergroup or channel, and press **Set up**.
2. Grant your own user account **Manage Video Chats / Manage Live Streams**. Open the community in Telegram so it appears in account dialogs.
3. Press **Connect voice account → Scan login QR**. Show the QR on a second screen; use Telegram **Settings → Devices → Link Desktop Device** to scan and accept it. Tokens refresh; the whole attempt expires after two minutes.
4. The server automatically matches the resulting account ID to your bot-chat ID and checks current account/bot admin status and account call-management rights. Different scanned accounts are rejected; new rejected sessions are revoked where possible.
5. The session is encrypted with AES-256-GCM under `DATA_DIR/voice-accounts/`, bound to this community, and **Voice controls ON** becomes available. Linking your account to another community reuses the verified session after fresh rights checks. Each community uses one account binding.
6. `/disconnectvoice` privately detaches YOUR QR account from every bound community and attempts logout. In Telegram **Settings → Devices**, terminate the session if it remains. This recovery command works before the hosted channel-subscription gate.

**2FA limitation:** Telegram can require a cloud password after QR approval. This version never collects OTP/password in bot messages. That attempt stops; use the local wizard on your own self-hosted VPS, keeping 2FA enabled. Universal automatic login is not claimed. The session grants broad account authority; encryption at rest cannot prevent the VPS operator accessing a loaded session. Trust the operator and use a dedicated admin account where practical.

## Operator: enable QR once

Stop your installed npm/PM2 service, install updated dependencies and run:

```bash
npm ci --ignore-scripts
bash scripts/voice-setup.sh --qr
```

The helper asks for API ID/hash from [my.telegram.org/apps](https://my.telegram.org/apps), generates `MT_SESSION_KEY` if absent, preserves unrelated settings, and sets `MT_QR_ENABLED=true`. It requests no phone code/password and logs in to no user. Restart your configured service afterwards; owner PM2: `bash svc restart sentinelvc-master --update-env`. Back up the key privately with encrypted account files. Replacing the key makes old ciphertext unreadable. Default capacity is 20 accounts and five concurrent login attempts; measure resource use before increasing `MT_MAX_ACCOUNTS`.

For Docker, put `MT_API_ID`, `MT_API_HASH`, `MT_QR_ENABLED=true`, `MT_MAX_ACCOUNTS=20` and a fresh 64-character hex `MT_SESSION_KEY` in the host `.env`. Generate the key locally with `openssl rand -hex 32`; save it only in `.env`. Leave `MT_ENABLED=false` and `MT_ALLOWED_CHATS` empty unless also using the local operator adapter. Run `docker compose up -d --build --force-recreate`. The existing writable data volume holds encrypted QR sessions. No HTTPS domain is needed for QR image delivery.

## Easy account connection — npm / PM2

This alternative uses local terminal login, including password-required accounts. Open `/communities` privately for your community numeric ID.

1. Log in at [my.telegram.org/apps](https://my.telegram.org/apps) using your own Telegram account. Create an API application and obtain its **API ID** and **API hash**. These are separate from your BotFather bot token.
2. Grant this same user account **Manage Video Chats / Manage Live Streams** in every community to be monitored. For channel calls this account must be a channel administrator. The bot remains a separate administrator.
3. In the installed bot's directory run `bash scripts/voice-setup.sh` (or `npm run voice:setup`). The owner PM2 package detects its bundled Node runtime. Have your `.env` and dependencies installed first.
4. Enter API ID, API hash, and the comma-separated numeric group/channel IDs shown in the bot's private panel. The helper preserves your bot token, port and other configuration. It disables voice in the saved configuration until account authorization succeeds.
5. If no session exists, enter your account phone number, Telegram login code and 2FA password when requested. Code/password/hash entry is hidden. Existing session files are reused and checked; they are not overwritten. The session is stored locally with restrictive permissions.
6. Confirm the printed account ID belongs to your intended user administrator. Restart the bot service. Owner package: `bash svc restart sentinelvc-master --update-env`; ordinary npm deployments restart their configured service. Stop a currently running service before changing its account credentials to avoid two configurations being active during setup.
7. Open the private community panel → **Voice controls ON** → **Raid shield ON**. Start in **Observe**. Refresh the panel until `call-state monitoring` appears. A partial/hidden-listener status does not mean complete coverage.

The local adapter uses one operator session and a static allowlist. It can coexist with separate per-admin QR clients; a community assigned to the local account is not also assigned to a QR account. Neither route asks users to send login codes to the master bot.

## Call protection controls

**End call (everyone)** is a separate manual emergency control. Its private confirmation expires after 60 seconds and captures the current call ID. Fresh admin/call rights and a remote call-ID check precede `phone.discardGroupCall`. All speakers/listeners disconnect. A burst never triggers it automatically. Start a replacement call manually if appropriate. An acknowledgement proves neither crash prevention nor audio recovery.

If participants already enter muted, repeating join-muted adds no new protection. Muted listeners and approved speakers can both fall outside this policy's protection against client/transport failure. Without attacker attribution or media/client evidence, the bot cannot identify the responsible ID or guarantee continued audio for everyone. Account login and CAPTCHA do not close that gap. Test both muted and speaking cases; actual exploit prevention remains unestablished.

- **Raid shield:** detects a window of distinct delivered user joins, independently of per-user churn. Default floor is 12 distinct joins within 10 seconds, with a threshold that can increase against prior quiet-window activity. In Observe it audits and attempts private alerts to up to three registered, currently verified admins. In Enforce it requests join-muted admission. It does not ban individual users based on a collective burst.
- **Guard each call:** in Enforce, requests join-muted for a discovered supported call before an anomaly is required. Discovery occurs after server updates and periodic refresh; it cannot guarantee that the first join happens after protection is applied. For important events also set mute-on-entry directly in Telegram before sharing access.
- **Rotate speaking links:** explicit opt-in for resetting the active call's invitation hash when applying protection. Old speaking-invite links can otherwise permit speaking in a join-muted call. This changes call invitation access; it does not revoke the underlying group/channel invitation. New speaking invitations must be deliberately managed by the admin.
- **Mute new arrivals:** confirmation button applies join-muted immediately to a fresh active call, with optional invitation-hash reset. Current speakers are preserved. It works as an explicitly requested action even in Observe.
- **Open admission:** confirmation button sets default admission back to unmuted. Turn off Guard each call first. Existing forcibly muted participants are not automatically unmuted, and revoked links are not restored. An enabled Raid shield may apply protection again on a later burst.

Join-muted is a **speaking admission policy**, not a ban on joining or a firewall. Delivered joins can reflect legitimate audience arrivals, transport reconnects or adversarial activity. The interface cannot measure the other clients' audio loss, RTT, connecting state or Telegram's server load. A sudden single-user exploit without observable churn may remain invisible. Only a deployment study can establish whether these controls improve audio/connection availability for the observed incident.

Tune `VC_RAID_WINDOW_SECONDS`, `VC_RAID_UNIQUE_JOINS`, and `VC_RAID_BASELINE_MULTIPLIER` on independent benign activity. Legitimate audience surges can trigger the shield. Baseline evidence resets on restart/resynchronization, and incomplete/reordered updates can reduce detection coverage. No automatic admission reopening is scheduled; review the incident and reopen deliberately.

## Docker account login

Docker users can use the manual steps below to set API credentials/allowlist in `.env` with `MT_ENABLED=false`. Stop the current service, rebuild the updated image, then run the existing terminal login with a writable secret mount:

```bash
docker compose stop sentinel
docker compose build sentinel
docker compose run --rm --no-deps -it --user root --entrypoint node -v "$PWD/.secrets:/app/.secrets:rw" sentinel scripts/mtproto-login.js
sudo chown 1000:1000 .secrets/mtproto.session
sudo chmod 600 .secrets/mtproto.session
```

The supplied image runs as the `node` user (UID 1000). If already root on the VPS, omit `sudo`. Keep the host `.secrets/` directory private and accessible to the container user; see [secret mount ownership](SELF_HOSTING.md). Existing session files are not overwritten. After a successful login, set `MT_ENABLED=true` in `.env`, then `docker compose up -d --force-recreate`. The running service mounts the session read-only. The easier wizard above is for a host Node/PM2 installation, rather than a bind-mounted `.env` inside a container.

## Step-by-step

1. Deploy your own bot and make it a supergroup/channel admin. Open `/communities` in its private chat, select the community and press **Set up**. Public and private communities work through Telegram's selector, without needing a username.
2. Copy the numeric ID displayed in the private panel. An already known negative ID also works with `/community NEGATIVE_ID`. The linked discussion group has a different ID and must be enrolled separately.
3. Log in to [Telegram's API application page](https://my.telegram.org/apps) as the consenting operator and obtain `api_id` and `api_hash`.
4. In `.env`, set `MT_API_ID`, `MT_API_HASH`, and `MT_ALLOWED_CHATS` to the numeric supergroup/channel ID (comma-separated for multiple communities). Keep `MT_ENABLED=false` until the session exists.
5. On the operator's machine in the project folder:

```bash
npm ci --ignore-scripts
npm run mtproto:login
```

The interactive command asks for the account phone, Telegram code, and 2FA password when applicable. Codes/passwords are hidden. It writes a new `.secrets/mtproto.session` without printing the session. An existing file is not overwritten. If Telegram demands a provider CAPTCHA during login, complete the account's official flow and try again; this script does not bypass the provider challenge.

6. Add this same user account to the supergroup or channel and grant **Manage Video Chats / Manage Live Streams** (the MTProto `manage_call` right). The bot remains a separate administrator; **Restrict Members** is required for supergroup chat moderation only. Open the community in the account's Telegram app so it is discoverable in its dialogs. Resolve session file ownership as described in the deployment guide if using Docker.
7. Set `MT_ENABLED=true`, restart the service, then open the community's private panel and enable **Voice controls**. Equivalent private commands, using your actual ID:

```text
/community -1001234567890 vc on
/community -1001234567890 status
```

8. Start a normal live voice/video call. Give discovery up to one minute and refresh the private panel for `call-state monitoring`. Begin in **Observe** with consenting test participants. Once authorized staging checks pass, enable **Enforce**. **Join muted** enables muted-by-default admission during detected churn; it does not immediately lock the call.

## Channel administration in private

Telegram calls a channel voice/video call a livestream, even when it is not using an external RTMP publisher. Normal non-RTMP channel calls are supported. Channel posts do not reliably identify the human administrator, so configuration is accepted only in the bot’s private chat after fresh channel-admin checks.

```text
/channel @channelusername setup
/channel @channelusername status
/channel @channelusername vc on
/channel @channelusername mode observe
/channel @channelusername incidents
```

Once authorized staging checks pass, use `/channel @channelusername mode enforce`. Optional `/channel @channelusername vclock on` enables join-muted requests on future detections; it does not immediately lock a call. Disable with `/channel @channelusername vc off` or `/channel @channelusername disable`. The operator still must configure the user adapter, grant its call-management rights, and include the numeric channel ID in `MT_ALLOWED_CHATS`. Allow up to a minute for discovery. A channel admin cannot enable an unallowlisted channel.

For a private channel, use **Select community → Channel**, then copy the numeric ID from the panel. A known ID can replace the username in every example above. Do not substitute an invite link or discussion-group ID. Channel enrollment starts in observe mode. No subscriber CAPTCHA, subscriber restriction or channel-post antiflood is applied. Supergroups use the same private controls; nothing is posted in either community.

## What happens during a detection

The adapter checks the target's current administrator status and its own current call-management rights. It looks up the participant in the active call and requests an admin mute when applicable. The **Join muted** policy additionally requests `joinMuted=true`. Intent and RPC acknowledgement are audited separately. An acknowledged user mute triggers a private notification attempt; blocked/unopened inboxes prevent delivery. A participant who already left may no longer be muteable; admission policy can still be applied when enabled.

These call actions have no automatic expiry in this implementation. An administrator must review/unmute the participant or change join-muted using Telegram's call interface. Restart, disabling protection/voice policy, switching to Observe, and solving a chat challenge do not automatically reverse a live-call action. This avoids granting live-call speaking rights to a different session after a restart or moderator change.

## Coverage limits

- Only allowlisted, enrolled supergroups/channels with voice opt-in are monitored. Use the private panel or `/community TARGET vc on` privately.
- Call-state transitions are server-delivered observations. Their delivery, completeness, latency and actual mute effect must be measured in a private authorized deployment.
- Missing call revisions suppress the questionable event and trigger a fresh snapshot.
- No account creation timestamp is fetched or estimated.
- The adapter does not join the media stream, sniff packets or see RTP loss/rate counters.
- RTMP publishing, scheduled/conference calls and participants joining **as a channel identity** are outside this version. A channel hosting a call is supported; a channel identity participating in a call is not treated as a user. Hidden listeners and stream-only viewers are not a complete participant feed; status reports partial coverage when `listeners_hidden` is set.
- A mute does not establish that a client crash or UDP flood was stopped.
- When capability discovery budgets are exceeded, coverage degrades visibly; shard by separate bot/account deployments before claiming SaaS capacity.

Protocol sources: [Telegram group-call types](https://core.telegram.org/api/group-calls), [participant moderation](https://core.telegram.org/method/phone.editGroupCallParticipant). Channel support has automated mocked integration coverage; live delivery and mute effectiveness remain unverified until operator staging tests.
