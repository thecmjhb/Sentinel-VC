# Collective voice-shield follow-up artifact

Six deterministic fixtures, 30 events each, generated on 4 October 2026. No live Telegram, media, packet or mitigation experiment was run. `voice-shield.json` records the identity pattern, fixed event intervals and virtual flags. A legitimate audience surge is deliberately identical to the rapid distributed-join trace and receives the same collective flag.

The 24,000-episode individual-detector bundle in `../synthetic-v1/` is separate and unchanged. These six cases do not estimate field accuracy or statistical significance.

Verify files against `SHA256SUMS.txt`. From this bundle's `source/` directory:

```bash
npm ci --ignore-scripts
node benchmarks/voice-shield.js
```

The generated JSON is `source/benchmarks/results/voice-shield.json`. It should equal the frozen JSON byte-for-byte. The snapshot includes the individual detector, collective detector, configuration, package/lockfile and fixture generator. Remote login/account-control implementation is intentionally outside this offline experiment.
