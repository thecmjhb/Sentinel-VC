import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, languageCode } from '../languages.js';
import { uiFixture } from '../test-support/uiFixture.js';

test('private start exposes 20 language choices; self-hosted onboarding never checks a channel', async t => {
  const f = uiFixture(t);
  await f.update('/start');
  const buttons = f.calls.at(-1).payload.reply_markup.inline_keyboard.flat();
  assert.equal(buttons.length, 20);
  assert.equal(new Set(buttons.map(b => b.callback_data)).size, 20);
  assert.equal(f.calls.filter(c => c.method === 'getChatMember').length, 0);
});
test('all 20 selections produce translated guides and remember the user preference', async t => {
  const f = uiFixture(t);
  for (const [code, locale] of Object.entries(LANGUAGES)) {
    await f.update(undefined, `ui:lang:${code}`);
    assert.equal(f.store.language(1), code);
    assert.ok(f.lastText().includes(locale.guide));
    assert.ok(f.lastText().length < 4096);
    await f.update('/help');
    assert.ok(f.lastText().includes(locale.guide));
  }
});
test('invalid selections cannot overwrite saved preferences; locale variants resolve safely', async t => {
  const f = uiFixture(t);
  f.store.setLanguage(1, 'ru');
  await f.update(undefined, 'ui:lang:xx');
  assert.equal(f.store.language(1), 'ru');
  assert.equal(languageCode('zh-hans'), 'zh');
  assert.equal(languageCode('pt_BR'), 'pt');
  assert.equal(languageCode('__proto__'), 'en');
});
