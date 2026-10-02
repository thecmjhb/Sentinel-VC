# Optional direct voice-call setup

Ordinary deployment uses the bot token only. Direct voice-call state monitoring requires a separate consenting **user** admin account because Telegram's call-management methods are user-only. The optional adapter uses `teleproto`, a maintained GramJS-compatible MTProto client; the pinned `telegram` package was deprecated at the time of implementation. See [migration documentation](https://docs.teleproto.dev/migrating-from-gramjs).

This account has normal user-session access. Use an account specifically managed for the authorized communities, protect its session, and review Telegram's terms and your community's privacy expectations. Do not request another person's login code or session string. The supplied login runs locally on the operator's terminal.

## Step-by-step

1. First deploy the bot normally and enroll your staging supergroup with `/setup`.
2. Use `/status` to obtain the numeric supergroup ID.
3. Log in to [Telegram's API application page](https://my.telegram.org/apps) as the consenting operator and obtain `api_id` and `api_hash`.
4. In `.env`, set `MT_API_ID`, `MT_API_HASH`, and `MT_ALLOWED_CHATS` to that group ID. Keep `MT_ENABLED=false` until the session exists.
5. On the operator's machine in the project folder:

```bash
npm ci --ignore-scripts
npm run mtproto:login
```

The interactive command asks for the account phone, Telegram code, and 2FA password when applicable. Codes/passwords are hidden. It writes a new `.secrets/mtproto.session` without printing the session. An existing file is not overwritten. If Telegram demands a provider CAPTCHA during login, complete the account's official flow and try again; this script does not bypass the provider challenge.

6. Add this same user account to the supergroup and grant **Manage Video Chats**. The bot remains a different administrator with **Restrict Members**. Open the group in the account's Telegram app so it is discoverable in its dialogs. Resolve session file ownership as described in the deployment guide if using Docker.
7. Set `MT_ENABLED=true`, restart the service, and as a group admin use:

```text
/vc on
/status
```

8. Start a normal live voice/video call. Give discovery up to one minute and check `/status` for `call-state monitoring`. Begin with `/mode observe` and consenting test participants. Once authorized staging checks pass, use `/mode enforce`. If your policy also needs muted-by-default admission during detected churn, use `/vclock on`.

## What happens during a detection

The adapter checks the target's current administrator status and its own current call-management rights. It looks up the participant in the active call and requests an admin mute when applicable. `/vclock on` additionally requests `joinMuted=true`. Intent and RPC acknowledgement are audited separately. A participant who already left may no longer be muteable; a group admission policy can still be applied when enabled.

These call actions have no automatic expiry in this implementation. A group administrator must review/unmute the participant or change the call's join-muted setting using Telegram. Restart, `/vc off`, `/disable`, `/mode observe`, and a solved arithmetic gate do not automatically reverse a live-call action. This avoids granting live-call speaking rights to a different session after a restart or moderator change.

## Coverage limits

- Only allowlisted, enrolled supergroups that also use `/vc on` are monitored.
- Call-state transitions are server-delivered observations. Their delivery, completeness, latency and actual mute effect must be measured in a private authorized deployment.
- Missing call revisions suppress the questionable event and trigger a fresh snapshot.
- No account creation timestamp is fetched or estimated.
- The adapter does not join the media stream, sniff packets or see RTP loss/rate counters.
- RTMP, scheduled/conference calls and channel identities are outside this version.
- A mute does not establish that a client crash or UDP flood was stopped.
- When capability discovery budgets are exceeded, coverage degrades visibly; shard by separate bot/account deployments before claiming SaaS capacity.
