# Moderation data and privacy

Sentinel-VC is self-hosted software. For the project bot, the operator of @sentinelvcbot controls its VPS and database. For a fork, the person hosting that fork is the operator. This document describes the supplied code; operator changes and backups may alter handling.

## Data used by this version

In-memory evidence uses group/user identifiers, event kind, timings, bucket state, and a weak username-presence signal. SQLite stores enrolled group settings, temporary challenge state, action cooldowns, short-lived update identifiers and audit entries. Audit entries can include group/user IDs, action timestamps, event class, threat score, restriction expiry, and optional call identifiers.

The code does not store message text or audio in its moderation database. It does not collect a media packet stream or infer Telegram account creation dates. Logs redact errors rather than serializing full API objects or credentials. An operator should preserve that behavior when adding debugging.

## Retention and access

Language selection stores your Telegram user ID, chosen language code and last selection time in SQLite. It is used for private onboarding and guides, and expires one year after the last selection. You can change it with `/language`.

Private controls store community numeric IDs, type, title and administrator-to-community links. Links expire one year after their last verified update; bot removal deletes the remembered community. Revoked administrators are unlinked when detected by a fresh permissions check. Selector request IDs expire after five minutes. These records aid discovery and never replace current authorization. An enrolled community's metadata can remain until it is disabled, removed or no longer referenced. Community lists and challenges are shown only in private chats. Telegram prevents unsolicited inbox delivery; failed delivery is audited and recovery remains available through `/verify`.

`RETENTION_DAYS` defaults to seven days for audit entries. Maintenance prunes old audits and expired challenge/cooldown/update records approximately once per minute while running; downtime delays that task. TTL and capacity bounds govern in-memory evidence. Settings remain until the group is disabled or removed. The source does not impose a separate backup-retention policy; the operator must document one if backups are kept.

The private **Incidents** button (or `/community TARGET incidents`) is restricted to current administrators of that community and returns only its recent retained records. SQLite files are local to the operator. Metrics require a bearer secret and contain aggregate counts/process information. No public dashboard or third-party analytics service is bundled.

## Secrets and optional voice account

QR connections bind each verified account to its private bot-chat ID and selected communities. Expiring images are sent privately with content protection; deletion is attempted on refresh/completion/cancellation. Screenshots or Telegram copies may remain. Tokens are transient and never audited. OTP and 2FA passwords are not collected in bot messages; password-required accounts use local VPS login.

AES-256-GCM encrypts session, owner ID and community bindings in `DATA_DIR/voice-accounts/`. The deployment key lives separately in `.env`. Sessions persist until disconnect/removal, rather than audit retention. `/disconnectvoice` detaches your QR account everywhere, deletes its record and attempts logout; failed logout requires manual termination in Telegram Settings → Devices. Backups may retain ciphertext. This recovery command works before the hosted subscription gate.

A user session has broad account authority. Adapter allowlists constrain the supplied code, rather than cryptographically restricting the operator or Telegram session. Encryption at rest cannot prevent the operator reading a loaded session. `getDialogs` may receive dialog metadata and last-message data transiently for entity resolution; these contents are not persisted or used for moderation. Back up key and ciphertext privately and trust your operator.

Bot tokens and user-account sessions are secrets, not public research artifacts. The optional adapter uses a consenting administrative account in explicitly allowed groups. Session files can grant account access; keep them private and revoke compromised sessions in Telegram. A challenge does not require joining the project's updates channel.

Before opening a public master bot, the operator should publish an actual contact path for data questions and describe deployment/backup changes. This repository does not invent a privacy contact email or certify compliance with every jurisdiction.
