import { Bot } from 'grammy';
import { Store } from '../store.js';
import { loadConfig } from '../config.js';
import { createApplication } from '../index.js';

export function uiFixture(t, dependencies = {}) {
  const store = new Store(':memory:');
  const self = { id: 9, is_bot: true, first_name: 'Fixture', username: 'sentinelvcbot' };
  const bot = new Bot('9:offline_test_only', { botInfo: { ...self, can_join_groups: true, can_read_all_group_messages: true, supports_inline_queries: false } });
  const calls = [];
  const state = { channelStatus: 'left', channelError: false };
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload });
    let result = true;
    if (method === 'getChat') result = { id: Number(payload.chat_id) || -100111, type: 'supergroup', title: 'Fixture' };
    if (method === 'getChatMember') {
      if (payload.chat_id === '@sentinelvc' && state.channelError) return { ok: false, error_code: 503, description: 'Unavailable' };
      result = { user: { id: payload.user_id, is_bot: false, first_name: 'Fixture' },
        status: payload.chat_id === '@sentinelvc' ? state.channelStatus : 'administrator', can_restrict_members: true };
    }
    if (method === 'sendMessage') result = { message_id: calls.length, date: 1, chat: { id: payload.chat_id, type: 'private' }, text: payload.text };
    return { ok: true, result };
  });
  const app = createApplication(loadConfig({}, { requireToken: false }), { ...dependencies, bot, store, budget: { allow: () => true, pause() {} } });
  t.after(async () => { await app.queue.drain(); store.close(); });
  let id = 1;
  const from = { id: 1, is_bot: false, first_name: 'User', language_code: 'en' };
  async function update(text, data, group = false) {
    store.db.prepare('DELETE FROM cooldowns').run();
    const chat = { id: group ? -100111 : 1, type: group ? 'supergroup' : 'private' };
    const message = { message_id: id, date: Math.floor(Date.now() / 1000), chat, from, text,
      entities: text ? [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }] : undefined };
    await bot.handleUpdate(data ? { update_id: id++, callback_query: { id: String(id), from, chat_instance: '1', message, data } }
      : { update_id: id++, message });
  }
  return { ...app, calls, state, update, lastText: () => calls.filter(c => c.method === 'sendMessage').at(-1)?.payload.text };
}

