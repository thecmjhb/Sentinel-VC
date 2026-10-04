# Security and responsible disclosure

Report a suspected vulnerability through [GitHub private vulnerability reporting](https://github.com/thecmjhb/Sentinel-VC/security/advisories/new) when available. If private reporting is unavailable, keep sensitive details private until a suitable reporting channel is available. Do not post tokens, user sessions, private group IDs or exploitable third-party crash payloads in public issues.

Include affected version, observable behavior, impact and a minimal reproduction against your own local/private staging environment. Report whether it affects moderation decisions, administrator authorization, secret handling, persistence, or service availability. Provider/client vulnerabilities should also be disclosed to Telegram through its official reporting channels.

The code defaults to observe mode. Master-bot operators must verify permission handling and rollback/recovery in staging. Bot-token and MTProto session leaks require revocation through BotFather and Telegram's active-session controls respectively; changing `.env` alone does not revoke an exposed credential.

Current security-relevant limitations are documented in `docs/ARCHITECTURE.md`: provider-dependent update delivery, no remote permission CAS, in-memory evidence reset on restart, weak arithmetic gate, bounded queue shedding, manual call restoration, and no network-level UDP filter. These are explicit scope limits, not asserted protections.

QR sessions are encrypted at rest but grant broad account access to the hosting operator. Privately retain the deployment key with encrypted backups; never publish either. Keep 2FA enabled and never submit OTP/password/session material in bot chat. Reapplying mute-on-entry does not establish protection against client/media exhaustion. Manual call termination disconnects everyone and is not evidence of exploit prevention.
