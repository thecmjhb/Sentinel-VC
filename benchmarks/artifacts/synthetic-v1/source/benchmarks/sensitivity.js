// Paired developmental sensitivity analysis. No Telegram/network traffic.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AntiFlood } from '../antiFlood.js';
import { loadConfig } from '../config.js';
import { rng, scenarios, trace } from './benchmark.js';

const config = loadConfig({}, { requireToken: false });
const policies = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(threshold =>
  ({ name: `threshold_${threshold}`, threshold, remove: () => 0 }));
policies.push(
  { name: 'without_profile', threshold: 65, remove: (r, e) => e.username === '' ? 5 : 0 },
  { name: 'without_recent_join', threshold: 65, remove: r => r.recentJoin ? 5 : 0 },
  { name: 'without_group_pressure', threshold: 65, remove: r => r.chatExceeded ? 20 : 0 },
  { name: 'without_context', threshold: 65, remove: (r, e) =>
    (e.username === '' ? 5 : 0) + (r.recentJoin ? 5 : 0) + (r.chatExceeded ? 20 : 0) }
);
const median = values => values.length ? [...values].sort((a, b) => a - b)[Math.ceil(values.length / 2) - 1] : null;

export function runSensitivity() {
  const rows = [], trials = [], digest = createHash('sha256');
  for (const [scenarioIndex, scenario] of scenarios.entries()) {
    const outcomes = policies.map(() => ({ hits: 0, latencies: [] }));
    for (let seed = 1; seed <= 30; seed++) {
      const random = rng(seed * 65537 + scenarioIndex), seedHits = policies.map(() => 0);
      for (let episode = 0; episode < 100; episode++) {
        const events = trace(scenario, random);
        digest.update(JSON.stringify({ scenario: scenario.name, seed, episode, events }));
        let now = 100000;
        const detector = new AntiFlood(config, () => now), first = policies.map(() => null);
        for (const event of events) {
          now = 100000 + event.at;
          const result = detector.observe(event);
          for (const [i, policy] of policies.entries()) {
            // Removed contextual terms have integer weights, so subtraction commutes
            // with rounding. Remaining depletion/strike state is identical and paired.
            const score = result.score - policy.remove(result, event);
            if (first[i] === null && result.strikes >= 2 && score >= policy.threshold) first[i] = event.at;
          }
        }
        for (const [i, at] of first.entries()) if (at !== null) {
          outcomes[i].hits++; outcomes[i].latencies.push(at); seedHits[i]++;
        }
      }
      policies.forEach((policy, i) => trials.push({ scenario: scenario.name, policy: policy.name, seed, hits: seedHits[i], episodes: 100 }));
    }
    policies.forEach((policy, i) => rows.push({ scenario: scenario.name, malicious: scenario.malicious,
      policy: policy.name, threshold: policy.threshold, episodes: 3000, hits: outcomes[i].hits,
      misses: 3000 - outcomes[i].hits, medianDetectedOnsetMs: median(outcomes[i].latencies) }));
  }
  const summary = policies.map(policy => {
    const selected = rows.filter(r => r.policy === policy.name);
    const tp = selected.filter(r => r.malicious).reduce((n, r) => n + r.hits, 0);
    const fp = selected.filter(r => !r.malicious).reduce((n, r) => n + r.hits, 0);
    return { policy: policy.name, tp, fp, tn: 12000 - fp, fn: 12000 - tp,
      recall: tp / 12000, fpr: fp / 12000, precision: tp + fp ? tp / (tp + fp) : null };
  });
  const result = { evidence: 'PAIRED_DEVELOPMENTAL_SYNTHETIC_SENSITIVITY_NOT_LIVE_VALIDATION',
    generatedAt: new Date().toISOString(), node: process.version, seeds: 30,
    episodesPerPolicy: 24000, datasetSha256: digest.digest('hex'), rows, trials, summary,
    limitations: ['The same developmental corpus is reused; no independent holdout or significance claim.',
      'One-at-a-time context ablation at threshold 65; no re-tuning or group-pressure workload.',
      'All policy observations share each trace; variants are not independent new samples.',
      'Latency uses virtual event time and excludes undetected episodes.',
      'No live Telegram, media packets, enforcement, queue or database behavior is measured.'] };
  const dir = fileURLToPath(new URL('./results/', import.meta.url)); mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/sensitivity.json`, JSON.stringify(result, null, 2) + '\n');
  writeFileSync(`${dir}/sensitivity.csv`, 'policy,tp,fp,tn,fn,recall,fpr,precision\n' + summary.map(r =>
    [r.policy, r.tp, r.fp, r.tn, r.fn, r.recall, r.fpr, r.precision ?? ''].join(',')).join('\n') + '\n');
  console.table(summary); console.log(`Trace SHA-256: ${result.datasetSha256}`);
  return result;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) runSensitivity();
