import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const canRun = process.platform !== 'win32' || existsSync(bash);
function setup(t, { args = [], port = '8080', busy = '', bound = '', fail = '', shellPort = '' } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'sentinel-setup-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(path.join(dir, 'scripts'));
  mkdirSync(path.join(dir, 'bin'));
  copyFileSync(new URL('../scripts/setup.sh', import.meta.url), path.join(dir, 'scripts/setup.sh'));
  const original = `BOT_TOKEN=test-only-never-use\n# keep this comment\nHTTP_PORT=${port}\nDEFAULT_MODE=observe\n`;
  writeFileSync(path.join(dir, '.env'), original);
  writeFileSync(path.join(dir, 'bin/docker'), `#!/usr/bin/env bash
set -eu
case "$*" in
  'compose version'|'info'|'compose config --quiet'|'compose ps') exit 0 ;;
  'compose config --environment') awk '/^HTTP_PORT=/ {print}' .env ;;
  'compose port sentinel 8080') if [[ -n "$TEST_BOUND" ]]; then printf '%s\\n' "$TEST_BOUND"; else exit 1; fi ;;
  'compose up -d --build') printf 'START_PORT=%s\\n' "$HTTP_PORT"; exit "$TEST_FAIL" ;;
  *) exit 2 ;;
esac
`, { mode: 0o755 });
  writeFileSync(path.join(dir, 'bin/ss'), `#!/usr/bin/env bash
if [[ -n "$TEST_BUSY" && "$*" == *":$TEST_BUSY" ]]; then printf 'LISTEN busy\\n'; fi
`, { mode: 0o755 });
  const result = spawnSync(bash, ['-c', 'export PATH="$PWD/bin:$PATH"; bash scripts/setup.sh "$@"', 'setup-test', ...args], {
    cwd: dir, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, HTTP_PORT: shellPort, TEST_BUSY: busy, TEST_BOUND: bound, TEST_FAIL: fail || '0' }
  });
  assert.ifError(result.error);
  assert.ok(!result.stdout.includes('test-only-never-use'));
  return { ...result, original, env: readFileSync(path.join(dir, '.env'), 'utf8') };
}

test('setup preserves existing port and other settings on unattended upgrade', { skip: !canRun }, t => {
  const r = setup(t, { shellPort: '9999' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.env, r.original);
  assert.match(r.stdout, /START_PORT=8080/);
  assert.match(r.stdout, /127\.0\.0\.1:8080\/readyz/);
});
test('setup persists chosen port and prints matching readiness URL', { skip: !canRun }, t => {
  const r = setup(t, { args: ['--port', '19234'] });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.env, /HTTP_PORT=19234/);
  assert.match(r.env, /# keep this comment\nDEFAULT_MODE=observe/);
  assert.match(r.stdout, /START_PORT=19234/);
  assert.match(r.stdout, /127\.0\.0\.1:19234\/readyz/);
});
test('setup rejects an occupied port before changing existing configuration or starting', { skip: !canRun }, t => {
  const r = setup(t, { args: ['--port', '19234'], busy: '19234' });
  assert.equal(r.status, 1);
  assert.equal(r.env, r.original);
  assert.match(r.stdout, /already has a TCP listener/);
  assert.doesNotMatch(r.stdout, /START_PORT=/);
});
test('setup allows its own running container to keep a busy port', { skip: !canRun }, t => {
  const r = setup(t, { busy: '8080', bound: '127.0.0.1:8080' });
  assert.equal(r.status, 0, r.stderr);
});
test('setup validates port arguments before touching configuration', { skip: !canRun }, t => {
  for (const port of ['0', '65536', 'abc', '1;echo bad', '12345678901234567890']) {
    const r = setup(t, { args: ['--port', port] });
    assert.equal(r.status, 1);
    assert.equal(r.env, r.original);
    assert.match(r.stdout, /Port must be an integer/);
  }
});
test('setup reports Docker startup failures without claiming the container started', { skip: !canRun }, t => {
  const r = setup(t, { args: ['--port', '19234'], fail: '1' });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /Startup failed/);
  assert.doesNotMatch(r.stdout, /Container started/);
});
