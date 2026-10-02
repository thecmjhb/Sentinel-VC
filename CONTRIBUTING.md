# Contributing

Use Node.js 24 LTS and run `npm ci --ignore-scripts`, `npm run check`, `npm test`, and `npm audit --omit=dev`. Changes to scoring, permissions, persistence or update normalization need behavioral tests that cover false positives, failure recovery and tenant isolation. Keep dependencies pinned and commit the lockfile.

Do not conflate voice notes, call invitations, call membership transitions and packets. Every new adapter must declare its observations, actor attribution, credentials and permissible actions. Preserve current administrator checks and explicit opt-in. Never add a fabricated account-age estimate or label simulated metrics as observed production data.

Research contributions should provide seeds, raw anonymized observations when consent permits, trace-generation code, baseline configuration and evidence labels. A scoring microbenchmark must not be presented as API mitigation latency. Document negative outcomes and excluded attack classes.

Before release, run a Docker build and authorized live smoke tests. GitHub CI validates syntax, tests, dependency audit and image build; it does not attack or join Telegram communities. Changes to stored schema require a tested migration. Do not publish credentials or identifying participant traces.
