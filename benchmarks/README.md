# Offline benchmarks

Run from the repository root:

```bash
npm run benchmark
npm run benchmark:queue
npm run benchmark:sensitivity
```

`benchmark` compares three moderation policies on paired seeded synthetic event traces. It writes `results/local-replay.json` and `results/local-replay.csv`, including scenario flags, misses, seed summaries, virtual onset latency, trace digest and local resource timings.

`benchmark:queue` writes `results/illustrative-queue.json`. It is a queue model with assumed parameters, not a deployed service measurement.

`benchmark:sensitivity` reuses the paired traces for thresholds 50–100 and removes individual context terms at threshold 65. It writes `results/sensitivity.json` and `results/sensitivity.csv`. Seed-level counts and the trace digest support comparison with the baseline replay. This is developmental sensitivity analysis; it provides no independent holdout or significance claim.

These scripts send no Telegram requests or UDP traffic. They do not measure packet loss, real-world attack mitigation, voice-service uptime or client-crash prevention. The legitimate burst and hidden-media scenarios expose false positives and unobservable activity. Local scoring timings exclude network requests and database writes; onset times use the synthetic trace clock. Rerunning replaces generated files and resource timings vary by machine. Outputs are ignored by Git.

The frozen preliminary paper measurements and offline source snapshot are in [synthetic-v1](artifacts/synthetic-v1/README.md), with SHA-256 checksums. They predate the channel-control extension and are not channel-specific validation.

## Collective voice shield follow-up

`npm run benchmark:voice` replays six fixed call-state fixtures with 30 events each. It sends no Telegram requests or media. The distributed single-join burst is flagged at 1,650 ms of virtual time by the collective shield, while the per-user detector does not flag it. A legitimate audience surge with the same observation trace is flagged identically. Slow distributed joins and hidden media abuse are missed. Single-user churn is detected by the existing individual policy.

These are six deterministic illustrations, not an independent dataset or estimated field accuracy. The old 24,000-episode artifacts evaluate the individual detector and remain unchanged. The follow-up JSON and source snapshot are frozen in `artifacts/voice-shield-v1/` with SHA-256 checksums. In that snapshot's `source/`, run `npm ci --ignore-scripts` then `node benchmarks/voice-shield.js` to regenerate the fixture output. Operational RPC effect, actual audio loss and connecting delay remain unmeasured.
