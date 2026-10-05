import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';

// Async QR rendering/RPCs have no fixed event-loop tick count on different hosts.
// Keep a real deadline and yield to timers/I/O rather than busy-polling immediates.
export async function waitFor(predicate, description, timeoutMs = 2000) {
  const deadline = performance.now() + timeoutMs;
  for (;;) {
    const value = predicate();
    if (value) return value;
    if (performance.now() >= deadline) throw new Error(`Timed out waiting for ${description}`);
    await delay(5);
  }
}
