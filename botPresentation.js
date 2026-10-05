import { LANGUAGES } from './languages.js';

export const PROJECT = Object.freeze({
  bot: 'https://t.me/sentinelvcbot',
  updates: 'https://t.me/sentinelvc',
  source: 'https://github.com/thecmjhb/Sentinel-VC'
});

export function projectButtons(username, bangla = false) {
  const rows = [
    [{ text: bangla ? 'আপডেট চ্যানেল' : 'Updates channel', url: PROJECT.updates },
      { text: bangla ? 'সোর্স কোড' : 'Source code', url: PROJECT.source }]
  ];
  if (/^[A-Za-z0-9_]{5,32}$/.test(username || '')) {
    rows.unshift([{ text: bangla ? 'গ্রুপে যোগ করুন' : 'Add to your group',
      url: `https://t.me/${username}?startgroup=setup` }]);
  }
  return { inline_keyboard: rows };
}

// Clear old group menus; control is private even if an old client caches commands.
export async function configureCommandMenus(api) {
  for (const t of Object.values(LANGUAGES)) {
    const language_code = t.code === 'en' ? '' : t.code;
    const commands = [
      { command: 'start', description: t.help }, { command: 'communities', description: t.dashboard.title },
      { command: 'help', description: t.help }, { command: 'language', description: t.language },
      { command: 'verify', description: t.dashboard.gate }, { command: 'updates', description: t.updates },
      { command: 'disconnectvoice', description: t.code === 'bn' ? 'নিজের QR voice account বিচ্ছিন্ন করুন' : 'Disconnect your QR voice account' },
      { command: 'cancelvoice', description: t.code === 'bn' ? 'চলমান voice account login বাতিল করুন' : 'Cancel a pending voice-account login' },
      { command: 'privacy', description: t.code === 'bn' ? 'তথ্য ব্যবহারের নিয়ম' : 'Data handling' }
    ];
    for (const type of ['default', 'all_private_chats', 'all_chat_administrators'])
      await api.setMyCommands(type === 'all_private_chats' ? commands : [], { scope: { type }, language_code });
  }
}
