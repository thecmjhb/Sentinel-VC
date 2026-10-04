// Deterministic fluid queue illustration; this does not transmit any packets.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AntiFlood } from '../antiFlood.js';
import { loadConfig } from '../config.js';

const config = loadConfig({}, { requireToken: false });
const dt = 0.01, duration = 30, attackStart = 5, attackEnd = 20;
const capacity = 200, serviceRate = 200, benignRate = 100, hostileRate = 2000;
const policies = ['none', 'sentinel_cooperative_source', 'sentinel_unresponsive_udp_source'];
const results = policies.map(policy => {
  let now = 0, queue = 0, lost = 0, arrivals = 0, detectionAt = null, ackAt = null;
  let nextEvent = attackStart, eventIndex = 0; const windows = [];
  const detector = new AntiFlood(config, () => now * 1000);
  for (let step = 0; step < duration / dt; step++) {
    now = step * dt;
    if (policy !== 'none' && now >= nextEvent && now < attackEnd) {
      const hit = detector.observe({ chatId: -1001, userId: 1, kind: eventIndex++ % 2 ? 'vc_leave' : 'vc_join' }).attack;
      nextEvent += 0.15;
      if (hit && detectionAt === null) { detectionAt = now; ackAt = now + 0.15; }
    }
    const suppressed = policy === 'sentinel_cooperative_source' && ackAt !== null && now >= ackAt;
    const rate = benignRate + (now >= attackStart && now < attackEnd && !suppressed ? hostileRate : 0);
    const incoming = rate * dt, admitted = Math.min(incoming, capacity - queue);
    const dropped = incoming - admitted;
    queue = Math.max(0, queue + admitted - serviceRate * dt);
    arrivals += incoming; lost += dropped;
    const second = Math.floor(now);
    windows[second] ||= { arrivals: 0, lost: 0 };
    windows[second].arrivals += incoming; windows[second].lost += dropped;
  }
  const available = windows.filter(x => x.lost / x.arrivals <= 0.01).length;
  const after = windows.slice(8, 20);
  const afterLoss = after.reduce((sum, x) => sum + x.lost, 0) / after.reduce((sum, x) => sum + x.arrivals, 0);
  return { policy, modeledAvailabilityPercent: 100 * available / duration, modeledLossPercent: 100 * lost / arrivals,
    modeledPostOnsetLossPercentAt8to20Seconds: afterLoss * 100,
    virtualDetectionLatencyMs: detectionAt === null ? null : (detectionAt - attackStart) * 1000,
    assumedAcknowledgementLatencyMs: ackAt === null ? null : (ackAt - attackStart) * 1000 };
});
const output = { evidence: 'ILLUSTRATIVE_FLUID_QUEUE_MODEL_NOT_OBSERVED_TELEGRAM_UPTIME_OR_PACKET_LOSS',
  parameters: { dt, duration, attackStart, attackEnd, capacity, serviceRate, benignRate, hostileRate }, results,
  assumptions: ['A cooperative media source obeys a modeled mute after an assumed 150 ms delivery/action delay.',
    'An unresponsive UDP source ignores admission/mute and continues transmitting.',
    'Availability means a modeled one-second window with at most 1% modeled packet loss.',
    'Queues are fluid quantities, not captured UDP packets. This is not a model calibrated to Telegram.'] };
const directory = fileURLToPath(new URL('./results/', import.meta.url)); mkdirSync(directory, { recursive: true });
writeFileSync(`${directory}/illustrative-queue.json`, JSON.stringify(output, null, 2) + '\n');
console.table(results);
