// Offline event replay only: no sockets, Telegram sessions, media, or flood traffic.
import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { AntiFlood } from '../antiFlood.js';
import { loadConfig } from '../config.js';

const config = loadConfig({}, { requireToken: false });
export function rng(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}
export const scenarios = [
  { name: 'ordinary_messages', malicious: false, events: 40, kind: 'message', interval: [800, 3000] },
  { name: 'legitimate_message_burst', malicious: false, events: 18, kind: 'message', interval: [20, 120] },
  { name: 'legitimate_vc_reconnect', malicious: false, events: 8, kind: 'vc_join', interval: [300, 1200], alternate: true },
  { name: 'legitimate_intensive_collaboration', malicious: false, events: 40, kind: 'message', interval: [20, 70] },
  { name: 'rapid_message_abuse', malicious: true, events: 40, kind: 'message', interval: [20, 70] },
  { name: 'rapid_vc_churn', malicious: true, events: 24, kind: 'vc_join', interval: [50, 250], alternate: true },
  { name: 'slow_vc_churn', malicious: true, events: 16, kind: 'vc_join', interval: [4500, 6000], alternate: true },
  { name: 'unobservable_media_flood', malicious: true, events: 40, kind: 'message', interval: [800, 3000] }
];
export function trace(scenario, random) {
  let time = 0;
  const username = random() < 0.25 ? '' : 'participant';
  return Array.from({ length: scenario.events }, (_, i) => {
    if (i) time += scenario.interval[0] + random() * (scenario.interval[1] - scenario.interval[0]);
    return { at: time, chatId: -1001, userId: 1, username,
      kind: scenario.alternate && i % 2 ? 'vc_leave' : scenario.kind };
  });
}
function baseline(name, now) {
  let tokens = null, last = 0, windowStart = 0, count = 0;
  return event => {
    if (name === 'static_window') {
      if (now() - windowStart >= 1000) { windowStart = now(); count = 0; }
      return ++count > 10;
    }
    const cost = event.kind.startsWith('vc_') ? 4 : 1;
    const capacity = event.kind.startsWith('vc_') ? config.vcCapacity : config.userCapacity;
    const refill = event.kind.startsWith('vc_') ? config.vcRefill : config.userRefill;
    tokens = Math.min(capacity, (tokens ?? capacity) + (now() - last) * refill / 1000);
    last = now(); const exceeded = tokens < cost; tokens = Math.max(0, tokens - cost);
    return exceeded;
  };
}
const percentile = (values, p) => values.length ? [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1] : null;
export function wilson(successes, total) {
  if (!total) return null;
  const z = 1.959964, q = successes / total, d = 1 + z * z / total;
  const center = (q + z * z / (2 * total)) / d;
  const half = z * Math.sqrt(q * (1 - q) / total + z * z / (4 * total * total)) / d;
  return [center - half, center + half];
}
export function runBenchmark() {
  const rows = [], trials = [], timing = [], datasetHash = createHash('sha256');
  const wallStart = performance.now(), cpuStart = process.cpuUsage(); let peakRss = process.memoryUsage().rss;
  // One untimed warm-up reduces compilation effects; it does not validate the workload.
  const warm = new AntiFlood(config, () => 0);
  for (let i = 0; i < 10000; i++) warm.observe({ chatId: 1, userId: 1, kind: 'message' });
  for (const scenario of scenarios) {
    for (const model of ['static_window', 'token_bucket', 'sentinel']) {
      const detections = [], latencies = [];
      for (let seed = 1; seed <= 30; seed++) {
        const random = rng(seed * 65537 + scenarios.indexOf(scenario)); let hits = 0;
        for (let episode = 0; episode < 100; episode++) {
          const events = trace(scenario, random);
          if (model === 'sentinel') datasetHash.update(JSON.stringify({ scenario: scenario.name, seed, episode, events }));
          let now = 100000, detectionAt = null;
          const detector = model === 'sentinel' ? new AntiFlood(config, () => now) : null;
          const evaluate = detector ? event => detector.observe(event).attack : baseline(model, () => now - 100000);
          for (const event of events) {
            now = 100000 + event.at;
            const start = performance.now(); const hit = evaluate(event); const elapsed = performance.now() - start;
            if (model === 'sentinel' && timing.length < 500000) timing.push(elapsed * 1000);
            if (hit && detectionAt === null) detectionAt = event.at;
          }
          detections.push(detectionAt !== null);
          if (detectionAt !== null) { latencies.push(detectionAt); hits++; }
        }
        trials.push({ scenario: scenario.name, model, seed, hits, episodes: 100 });
        peakRss = Math.max(peakRss, process.memoryUsage().rss);
      }
      const hits = detections.filter(Boolean).length;
      rows.push({ scenario: scenario.name, malicious: scenario.malicious, model, episodes: detections.length, hits,
        detectionRate: hits / detections.length, wilson95: wilson(hits, detections.length),
        detectedEpisodeOnsetMedianMs: percentile(latencies, 0.5), detectedEpisodeOnsetP95Ms: percentile(latencies, 0.95),
        misses: detections.length - hits });
    }
  }
  const cpu = process.cpuUsage(cpuStart), elapsedMs = performance.now() - wallStart;
  const result = { evidence: 'MEASURED_LOCAL_SYNTHETIC_EVENT_REPLAY_NOT_TELEGRAM_OR_UDP',
    platform: process.platform, release: os.release(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length,
    node: process.version, generatedAt: new Date().toISOString(), seeds: 30, episodesPerSeedPerScenario: 100,
    datasetSha256: datasetHash.digest('hex'), configuration: { userCapacity: config.userCapacity, userRefill: config.userRefill,
      vcCapacity: config.vcCapacity, vcRefill: config.vcRefill, chatCapacity: config.chatCapacity, chatRefill: config.chatRefill, threshold: config.threshold }, rows, trials,
    performance: { completeBenchmarkWallMs: elapsedMs, cpuUserMs: cpu.user / 1000, cpuSystemMs: cpu.system / 1000,
      cpuPercentOfOneCore: (cpu.user + cpu.system) / (elapsedMs * 10), sampledPeakRssBytes: peakRss,
      scoringSampleCount: timing.length, scoringP50Microseconds: percentile(timing, 0.5), scoringP95Microseconds: percentile(timing, 0.95) },
    limitations: ['Episode-level synthetic labels; overlapping benign and malicious patterns are intentional.',
      'No Bot API calls, SQLite writes, queueing, TLS, MTProto transport, or network media in scoring timing.',
      'Onset latency uses a virtual trace clock and includes missed-episode counts separately.',
      'Wilson intervals assume independent episodes; shared seeds can introduce dependence. Seed summaries are also exported.',
      'RSS includes harness, stored samples, and baselines; it is not deployed-bot RAM.'] };
  const directory = fileURLToPath(new URL('./results/', import.meta.url)); mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/local-replay.json`, JSON.stringify(result, null, 2) + '\n');
  writeFileSync(`${directory}/local-replay.csv`, 'scenario,malicious,model,episodes,hits,detection_rate,median_onset_ms,p95_onset_ms,misses\n' +
    rows.map(x => [x.scenario, x.malicious, x.model, x.episodes, x.hits, x.detectionRate,
      x.detectedEpisodeOnsetMedianMs ?? '', x.detectedEpisodeOnsetP95Ms ?? '', x.misses].join(',')).join('\n') + '\n');
  console.table(rows.map(x => ({ scenario: x.scenario, model: x.model, episodes: x.episodes,
    'flagged %': (x.detectionRate * 100).toFixed(2), 'median onset ms': x.detectedEpisodeOnsetMedianMs?.toFixed(1) ?? 'unobserved' })));
  console.log(JSON.stringify({ evidence: result.evidence, performance: result.performance, datasetSha256: result.datasetSha256 }, null, 2));
  return result;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) runBenchmark();
