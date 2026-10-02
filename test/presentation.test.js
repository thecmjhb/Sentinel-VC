import test from 'node:test';
import assert from 'node:assert/strict';
import { configureCommandMenus, projectButtons, PROJECT } from '../botPresentation.js';

test('command menus separate administrator commands and support Bangla discovery', async () => {
  const calls = [];
  await configureCommandMenus({ setMyCommands: async (commands, options) => calls.push({ commands, options }) });
  assert.equal(calls.length, 6);
  for (const call of calls) {
    assert.equal(call.commands.some(x => x.command === 'doctor'), call.options.scope.type === 'all_chat_administrators');
    assert.ok(call.commands.every(x => /^[a-z_]{1,32}$/.test(x.command)));
  }
  assert.ok(calls.filter(x => x.options.language_code === 'bn').every(x => /[\u0980-\u09ff]/.test(x.commands[0].description)));
});

test('add-to-group button uses the actual deployed bot and does not require channel subscription', () => {
  const own = projectButtons('myselfhostbot');
  assert.equal(own.inline_keyboard[0][0].url, 'https://t.me/myselfhostbot?startgroup=setup');
  assert.equal(own.inline_keyboard[1][0].url, PROJECT.updates);
  assert.equal(projectButtons('invalid/name').inline_keyboard.length, 1);
});
