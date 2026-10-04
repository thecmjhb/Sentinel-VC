export function installRecovery({ bot, store, engine }) {
  const privateUser = ctx => ctx.chat?.type === 'private' && ctx.from && ctx.chat.id === ctx.from.id;
  const list = async (ctx, page = 0) => {
    const gates = store.userGates(ctx.from.id, page);
    const rows = gates.map(g => [{ text: `Verify / যাচাই ${g.chat_id}`, callback_data: `recover:${ctx.from.id}:${g.chat_id}` }]);
    const nav = [];
    if (page > 0) nav.push({ text: '←', callback_data: `recoverpage:${ctx.from.id}:${page - 1}` });
    if (gates.length === 5) nav.push({ text: '→', callback_data: `recoverpage:${ctx.from.id}:${page + 1}` });
    if (nav.length) rows.push(nav);
    return engine.reply(ctx.from.id, gates.length ? 'Your active chat verifications / আপনার যাচাইগুলো\nChoose a community below. Live-call mutes need administrator review.' :
      'No active chat challenge on this page. Live-call mutes need administrator review.',
    { reply_markup: { inline_keyboard: rows } });
  };
  // Recovery precedes hosted-service subscription gates. /start reveals only this user's gates.
  bot.command('start', async (ctx, next) => {
    if (privateUser(ctx) && store.userGates(ctx.from.id).length) {
      if (store.claim(`recovery-list:${ctx.from.id}`, 2000)) await list(ctx);
    }
    return next();
  });
  bot.command('verify', async ctx => {
    if (!privateUser(ctx) || !store.claim(`recovery-list:${ctx.from.id}`, 2000)) return;
    const value = String(ctx.match || '').trim();
    if (!value) return list(ctx);
    const id = Number(value);
    if (!/^-\d+$/.test(value) || !Number.isSafeInteger(id)) return engine.reply(ctx.from.id, 'Use /verify, or /verify NEGATIVE_CHAT_ID.');
    if (!await engine.showGate(id, ctx.from.id)) await engine.reply(ctx.from.id, 'No active chat challenge. A live-call mute needs administrator review.');
  });
  bot.callbackQuery(/^recoverpage:(\d+):(\d+)$/, async ctx => {
    if (!privateUser(ctx) || Number(ctx.match[1]) !== ctx.from.id) return;
    await engine.call('answerCallbackQuery', ctx.from.id, ctx.callbackQuery.id);
    if (store.claim(`recovery-list:${ctx.from.id}`, 2000)) await list(ctx, Number(ctx.match[2]));
  });
  bot.callbackQuery(/^recover:(\d+):(-\d+)$/, async ctx => {
    if (!privateUser(ctx) || Number(ctx.match[1]) !== ctx.from.id) return;
    await engine.call('answerCallbackQuery', ctx.from.id, ctx.callbackQuery.id);
    if (!store.claim(`recovery-list:${ctx.from.id}`, 2000)) return;
    const id = Number(ctx.match[2]);
    if (Number.isSafeInteger(id) && !await engine.showGate(id, ctx.from.id)) await engine.reply(ctx.from.id, 'Challenge expired.');
  });
  bot.callbackQuery(/^sv:(-\d+):([a-f0-9]{24}):(-?\d+)$/, async ctx => {
    if (!privateUser(ctx)) return;
    const id = Number(ctx.match[1]);
    if (!Number.isSafeInteger(id) || !store.claim(`answer:${id}:${ctx.from.id}`, 1000)) return;
    const result = await engine.verify(id, ctx.from.id, ctx.match[2], ctx.match[3]);
    await engine.call('answerCallbackQuery', ctx.from.id, ctx.callbackQuery.id, { text: result });
  });
}
