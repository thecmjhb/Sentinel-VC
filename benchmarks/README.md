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
