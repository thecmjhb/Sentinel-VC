import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { counters } from './runtime.js';

export function equalSecret(actual, expected) {
  if (typeof actual !== 'string' || !expected) return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function createHttpServer(config, status) {
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
    if (req.url === '/healthz') { res.writeHead(200); res.end('ok\n'); return; }
    if (req.url === '/readyz') { res.writeHead(status.ready ? 200 : 503); res.end(status.ready ? 'ready\n' : 'not ready\n'); return; }
    if (req.url === '/metrics' && config.metricsToken) {
      if (!equalSecret(req.headers.authorization, `Bearer ${config.metricsToken}`)) { res.writeHead(401); res.end(); return; }
      res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.end(Object.entries(counters).map(([key, value]) => `sentinel_${key}_total ${value}`).join('\n') +
        `\nsentinel_rss_bytes ${process.memoryUsage().rss}\nsentinel_uptime_seconds ${process.uptime()}\n`);
      return;
    }
    res.writeHead(404); res.end();
  });
  server.requestTimeout = 5000; server.headersTimeout = 5000; server.keepAliveTimeout = 1000;
  server.maxConnections = 100;
  return server;
}
