import { LANGUAGES, languageCode, languageKeyboard } from './languages.js';
import { PROJECT } from './botPresentation.js';

export function localeFor(ctx, store) {
  return LANGUAGES[languageCode(store.language(ctx.from?.id) || ctx.from?.language_code)];
}
export function installOnboarding({ bot, store, engine }) {
  const send = (ctx, text, reply_markup) => engine.reply(ctx.chat.id, text,
    { reply_markup, link_preview_options: { is_disabled: true } });
  const picker = ctx => send(ctx, '🌐 Language / ভাষা\n' + localeFor(ctx, store).language, languageKeyboard());
  const home = ctx => {
    const t = localeFor(ctx, store);
    const rows = [[{ text: t.help, callback_data: 'ui:help' }, { text: `🌐 ${t.language}`, callback_data: 'ui:languages' }]];
    if (/^[A-Za-z0-9_]{5,32}$/.test(bot.botInfo.username || ''))
      rows.unshift([{ text: t.add, url: `https://t.me/${bot.botInfo.username}?startgroup=setup` }]);
    rows.push([{ text: t.updates, url: PROJECT.updates }, { text: t.source, url: PROJECT.source }]);
    return send(ctx, `Sentinel-VC · ${t.name}\n\n${t.guide}\n\n` +
      '/language · /help · /setup · /doctor · /status · /incidents · /mode observe|enforce · /gate on|off · /vc on|off · /vclock on|off · /verify · /updates · /privacy · /disable', { inline_keyboard: rows });
  };
  // Language changes are private and bound to the callback sender, never a shared group preference.
  bot.command('language', ctx => ctx.chat?.type === 'private' ? picker(ctx) :
    send(ctx, '/language → @' + bot.botInfo.username));
  bot.command('start', ctx => ctx.chat?.type === 'private' && !store.language(ctx.from.id) ? picker(ctx) : home(ctx));
  bot.command('help', home);
  bot.callbackQuery(/^ui:(languages|help|lang:[a-z]{2})$/, async ctx => {
    if (ctx.chat?.type !== 'private' || ctx.chat.id !== ctx.from.id) return;
    await engine.call('answerCallbackQuery', ctx.chat.id, ctx.callbackQuery.id);
    if (!store.claim(`ui:${ctx.from.id}`, 1000)) return;
    const action = ctx.match[1];
    if (action === 'languages') return picker(ctx);
    if (action.startsWith('lang:')) {
      const code = action.slice(5);
      if (!Object.hasOwn(LANGUAGES, code)) return;
      store.setLanguage(ctx.from.id, code);
    }
    return home(ctx);
  });
  return { picker, home };
}
