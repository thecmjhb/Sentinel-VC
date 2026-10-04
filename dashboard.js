import { randomInt, randomBytes } from 'node:crypto';
import { isAdmin } from './securityEngine.js';
import { localeFor } from './onboarding.js';

const privateUser = ctx => ctx.chat?.type === 'private' && ctx.from && ctx.chat.id === ctx.from.id && !ctx.message?.sender_chat;
const targetPattern = /^(@[a-zA-Z][a-zA-Z0-9_]{3,31}|-\d+)$/;
const rights = { is_anonymous: false, can_manage_chat: true, can_delete_messages: false,
  can_manage_video_chats: false, can_restrict_members: false, can_promote_members: false,
  can_change_info: false, can_invite_users: false, can_post_stories: false, can_edit_stories: false, can_delete_stories: false };

export function installDashboard({ bot, store, engine, config }) {
  const text = ctx => localeFor(ctx, store).dashboard;
  const reply = (ctx, message, rows) => engine.reply(ctx.from.id, message,
    rows ? { reply_markup: { inline_keyboard: rows }, link_preview_options: { is_disabled: true } } : {});
  const button = (ctx, id, action, label) => ({ text: label, callback_data: `dash:${ctx.from.id}:${id}:${action}` });
  const limited = ctx => store.claim(`dashboard:${ctx.from.id}`, 1500);
  const ending = new Map();
  const allowedVoice = id => engine.vc?.allows?.(id) ?? (Boolean(engine.vc) && config.mtAllowedChats.has(String(id)));

  async function authorize(ctx, target, allowBotMissing = false) {
    const chat = await engine.call('getChat', /^-\d+$/.test(String(target)) ? Number(target) : ctx.from.id, target);
    if (!Number.isSafeInteger(chat.id) || chat.id >= 0 || !['supergroup', 'channel'].includes(chat.type))
      throw new Error('Use a supergroup or broadcast channel. Basic groups must be upgraded first.');
    const member = await engine.call('getChatMember', chat.id, chat.id, ctx.from.id);
    if (!isAdmin(member)) { store.unlinkCommunity(chat.id, ctx.from.id); throw new Error('Current administrator access is required.'); }
    const self = await engine.call('getChatMember', chat.id, chat.id, bot.botInfo.id);
    if (!allowBotMissing && !isAdmin(self)) throw new Error('Add this bot as administrator first.');
    return { chat, self };
  }
  async function list(ctx, page = 0) {
    const t = text(ctx), candidates = store.communitiesFor(ctx.from.id, page), rows = [];
    for (const known of candidates) {
      try {
        const { chat } = await authorize(ctx, Number(known.id));
        rows.push([button(ctx, chat.id, 'open', `${chat.type === 'channel' ? '📢' : '👥'} ${String(chat.title || chat.id).slice(0, 60)}`)]);
      } catch { /* No stale community name or ID is disclosed on failed authority checks. */ }
    }
    const navigation = [];
    if (page > 0) navigation.push(button(ctx, 0, `list${page - 1}`, '←'));
    if (candidates.length === 5) navigation.push(button(ctx, 0, `list${page + 1}`, '→'));
    if (navigation.length) rows.push(navigation);
    rows.push([button(ctx, 0, 'add', t.add), button(ctx, 0, `list${page}`, t.refresh)]);
    return reply(ctx, `${t.title}\n\n${t.intro}\n\n${rows.length === 1 ? t.empty : ''}\n${t.idHint}`, rows);
  }
  async function picker(ctx) {
    const t = text(ctx), groupRequest = randomInt(1, 1000000000), channelRequest = randomInt(1000000001, 2000000000);
    store.setSelector(ctx.from.id, groupRequest, channelRequest);
    await engine.reply(ctx.from.id, t.choose, { reply_markup: { resize_keyboard: true, one_time_keyboard: true,
      keyboard: [[{ text: t.group, request_chat: { request_id: groupRequest, chat_is_channel: false,
        user_administrator_rights: rights, bot_is_member: true, request_title: true } }],
      [{ text: t.channel, request_chat: { request_id: channelRequest, chat_is_channel: true,
        user_administrator_rights: rights, bot_is_member: true, request_title: true } }]] } });
  }
  async function panel(ctx, target, action = 'open', value, expectedType) {
    const t = text(ctx), { chat, self } = await authorize(ctx, target, action === 'disable');
    if (expectedType && chat.type !== expectedType) return reply(ctx, t.error);
    const id = chat.id;
    if (action === 'disable') {
      store.deleteGroup(id); engine.vc?.dropChat(id); engine.vc?.requestRefresh();
      return reply(ctx, t.disabled, [[button(ctx, 0, 'list0', t.back)]]);
    }
    store.rememberCommunity(chat, ctx.from.id, config.maxGroups);
    let settings = store.group(id);
    if (action === 'connect') return reply(ctx, `${config.mtQrEnabled ? t.qrGuide : t.voiceGuide}\n\nCommunity ID: ${id}`,
      [...(config.mtQrEnabled ? [[button(ctx,id,'linkaccount',t.scan)]] : []), [button(ctx,id,'open',t.back)]]);
    if (action === 'linkaccount') {
      if (!config.mtQrEnabled || !engine.vc?.connect) return reply(ctx,t.voiceGuide);
      await engine.vc.connect(ctx.from.id,id,t.languageCode === 'bn');
      return;
    }
    if (action === 'end') {
      if (!settings?.vc || !allowedVoice(id)) return reply(ctx,t.adapter);
      await engine.vc.endCall(id,settings,value);
      store.audit(id,ctx.from.id,'vc-manual-control',{action});
      return reply(ctx,t.ended,[[button(ctx,id,'open',t.back)]]);
    }
    if (['protect','admit'].includes(action)) {
      if (!settings?.vc || !allowedVoice(id)) return reply(ctx,t.adapter);
      if (action === 'admit' && settings.vcGuard) return reply(ctx, t.admitConfirm);
      await engine.vc.setAdmission(id,action === 'protect',settings,'manual');
      store.audit(id,ctx.from.id,'vc-manual-control',{action});
    }
    if (action === 'setup') {
      if (chat.type === 'supergroup' && !self.can_restrict_members) return reply(ctx, t.restrict);
      if (!settings && store.groups().length >= config.maxGroups) return reply(ctx, t.capacity);
      settings = { ...(settings || { mode: 'observe', gate: false, vc: false, vcLock: false }), chatType: chat.type };
      if (chat.type === 'channel') settings.gate = false;
      store.setGroup(id, settings); store.audit(id, ctx.from.id, 'enroll-private');
    } else if (['mode', 'gate', 'vc', 'vclock','vcshield','vcguard','vcrotate'].includes(action)) {
      if (!settings) return reply(ctx, t.setupFirst);
      const options = action === 'mode' ? ['observe', 'enforce'] : ['on', 'off'];
      if (!options.includes(value)) return reply(ctx, `Use ${options.join(' | ')}`);
      if (action === 'gate' && chat.type !== 'supergroup') return reply(ctx, t.noGate);
      if (chat.type === 'supergroup' && !self.can_restrict_members) return reply(ctx, t.restrict);
      if (['vc', 'vclock','vcshield','vcguard','vcrotate'].includes(action) && value === 'on' && !allowedVoice(id))
        return reply(ctx, `${t.adapter}\nID: ${id}`);
      const settingKeys={vclock:'vcLock',vcshield:'vcShield',vcguard:'vcGuard',vcrotate:'vcRotateInvites'};
      settings[settingKeys[action] || action] = action === 'mode' ? value : value === 'on';
      store.setGroup(id, settings); store.audit(id, ctx.from.id, 'configure-private', { action, value });
      if (action === 'vc') { if (value === 'off') engine.vc?.dropChat(id); engine.vc?.requestRefresh(); }
      if (action === 'vcguard' || action === 'mode') engine.vc?.requestRefresh();
    } else if (action === 'incidents') {
      const rows = store.incidents(id, 10);
      return reply(ctx, rows.length ? rows.map(r => `${new Date(r.at).toISOString()} | ${r.action} | ${r.user_id || 'call policy'}`).join('\n') : t.noIncidents,
        [[button(ctx, id, 'open', t.back)]]);
    }
    const rows = settings ? [
      [button(ctx, id, 'mode_observe', `${settings.mode === 'observe' ? '✓ ' : ''}${t.observe}`), button(ctx, id, 'mode_enforce', `${settings.mode === 'enforce' ? '✓ ' : ''}${t.enforce}`)],
      ...(chat.type === 'supergroup' ? [[button(ctx, id, settings.gate ? 'gate_off' : 'gate_on', `${t.gate}: ${settings.gate ? 'ON ✓' : 'OFF'}`)]] : []),
      [button(ctx, id, settings.vc ? 'vc_off' : 'vc_on', `${t.voice}: ${settings.vc ? 'ON ✓' : 'OFF'}`)],
      [button(ctx, id, settings.vcLock ? 'vclock_off' : 'vclock_on', `${t.lock}: ${settings.vcLock ? 'ON ✓' : 'OFF'}`)],
      [button(ctx, id, settings.vcShield ? 'vcshield_off' : 'vcshield_on', `${t.shield}: ${settings.vcShield ? 'ON ✓' : 'OFF'}`)],
      [button(ctx, id, settings.vcGuard ? 'vcguard_off' : 'vcguard_on', `${t.guard}: ${settings.vcGuard ? 'ON ✓' : 'OFF'}`)],
      [button(ctx, id, settings.vcRotateInvites ? 'vcrotate_off' : 'vcrotate_on', `${t.rotate}: ${settings.vcRotateInvites ? 'ON ✓' : 'OFF'}`)],
      [button(ctx,id,'confirmprotect',t.protect),button(ctx,id,'confirmadmit',t.admit)],
      [button(ctx,id,'confirmend',t.end)],
      [button(ctx, id, 'incidents', t.incidents), button(ctx, id, 'confirmdisable', t.disable)]
    ] : [[button(ctx, id, 'setup', t.setup)]];
    rows.push([button(ctx,id,'connect',t.connect)]);
    rows.push([button(ctx, id, 'open', t.refresh), button(ctx, 0, 'list0', t.back)]);
    return reply(ctx, `${chat.title || id}\nID: ${id}\n${chat.type}\n\n${t.status}: ${settings?.mode || t.notSetup}\n` +
      `${t.voice}: ${engine.vc?.capability(id) || t.adapter}\nJoin-muted: ${engine.vc?.entry?.(id)?.joinMuted === true ? 'ON (observed/acknowledged)' : 'unknown / OFF'}\n\n${t.recovery}`, rows);
  }
  const safe = async (ctx, task) => {
    try { return await task(); } catch { return reply(ctx, text(ctx).error); }
  };
  bot.command('communities', ctx => privateUser(ctx) && limited(ctx) ? safe(ctx, () => list(ctx)) : undefined);
  for (const alias of ['community', 'group', 'channel']) bot.command(alias, ctx => {
    if (!privateUser(ctx) || !limited(ctx)) return;
    const [target, action = 'open', value, ...extra] = String(ctx.match || '').trim().split(/\s+/);
    if (!target) return safe(ctx, () => list(ctx));
    if (!targetPattern.test(target) || extra.length || !['open', 'setup', 'doctor', 'status', 'incidents', 'disable', 'mode', 'gate', 'vc', 'vclock','vcshield','vcguard','vcrotate','connect'].includes(action))
      return reply(ctx, text(ctx).idHint);
    return safe(ctx, () => panel(ctx, target, ['doctor', 'status'].includes(action) ? 'open' : action, value, alias === 'channel' ? 'channel' : alias === 'group' ? 'supergroup' : undefined));
  });
  // Legacy action names remain usable privately with an explicit numeric ID or username.
  for (const action of ['setup', 'doctor', 'status', 'incidents', 'disable', 'mode', 'gate', 'vc', 'vclock']) bot.command(action, ctx => {
    if (!privateUser(ctx) || !limited(ctx)) return;
    const [target, value, ...extra] = String(ctx.match || '').trim().split(/\s+/);
    if (!target) return safe(ctx, () => list(ctx));
    if (!targetPattern.test(target) || extra.length) return reply(ctx, text(ctx).idHint);
    return safe(ctx, () => panel(ctx, target, ['doctor', 'status'].includes(action) ? 'open' : action, value));
  });
  bot.callbackQuery(/^dash:(\d+):(-?\d+):([a-z0-9_]+)$/, async ctx => {
    if (!privateUser(ctx) || Number(ctx.match[1]) !== ctx.from.id) return;
    await engine.call('answerCallbackQuery', ctx.from.id, ctx.callbackQuery.id);
    if (!limited(ctx)) return;
    const id = Number(ctx.match[2]), action = ctx.match[3];
    if (!Number.isSafeInteger(id)) return;
    await safe(ctx, async () => {
      if (id === 0 && /^list\d+$/.test(action)) return list(ctx, Number(action.slice(4)));
      if (id === 0 && action === 'add') return picker(ctx);
      if (id >= 0) return;
      if (action === 'confirmdisable') {
        await authorize(ctx, id, true);
        return reply(ctx, text(ctx).confirm, [[button(ctx, id, 'disable', text(ctx).disable), button(ctx, id, 'open', text(ctx).back)]]);
      }
      if (action === 'confirmend') {
        await authorize(ctx,id);
        const call=engine.vc?.entry?.(id);
        if (!store.group(id)?.vc || !allowedVoice(id) || !call) return reply(ctx,text(ctx).adapter);
        const now=Date.now();
        for (const [key, item] of ending) if (item.expires < now) ending.delete(key);
        if (ending.size >= config.maxGroups) return reply(ctx,text(ctx).capacity);
        const token=randomBytes(6).toString('hex');
        ending.set(`${ctx.from.id}:${id}`,{token,callId:String(call.call.id),expires:now+60000});
        return reply(ctx,text(ctx).endConfirm,[[button(ctx,id,`end_${token}`,text(ctx).end),button(ctx,id,'open',text(ctx).back)]]);
      }
      if (/^end_[a-f0-9]{12}$/.test(action)) {
        const key=`${ctx.from.id}:${id}`,pending=ending.get(key);
        if (!pending || pending.token !== action.slice(4) || pending.expires < Date.now()) return reply(ctx,text(ctx).error);
        ending.delete(key);
        return panel(ctx,id,'end',pending.callId);
      }
      if (['confirmprotect','confirmadmit'].includes(action)) {
        await authorize(ctx,id);
        const protect=action==='confirmprotect';
        return reply(ctx,protect?text(ctx).protectConfirm:text(ctx).admitConfirm,
          [[button(ctx,id,protect?'protect':'admit',protect?text(ctx).protect:text(ctx).admit),button(ctx,id,'open',text(ctx).back)]]);
      }
      if (['open', 'setup', 'incidents', 'disable','connect','linkaccount','protect','admit'].includes(action)) return panel(ctx, id, action);
      if (/^(mode_(observe|enforce)|(gate|vc|vclock|vcshield|vcguard|vcrotate)_(on|off))$/.test(action)) {
        const [key, value] = action.split('_'); return panel(ctx, id, key, value);
      }
    });
  });
  bot.on('message:chat_shared', async ctx => {
    if (!privateUser(ctx) || !limited(ctx)) return;
    const shared = ctx.message.chat_shared, expectedType = store.consumeSelector(ctx.from.id, shared.request_id);
    if (!expectedType || !Number.isSafeInteger(shared.chat_id)) return;
    await safe(ctx, () => panel(ctx, shared.chat_id, 'open', undefined, expectedType));
  });
  return { list, panel };
}
