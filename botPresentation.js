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

const entries = [
  ['start', 'Get started', 'শুরু করুন'], ['help', 'Show commands', 'কমান্ড দেখুন'],
  ['verify', 'Recover your chat challenge', 'নিজের verification খুলুন'],
  ['updates', 'Project links and updates', 'প্রজেক্ট ও আপডেট'],
  ['privacy', 'See moderation data handling', 'Moderation data-এর ব্যবহার'],
  ['setup', 'Enroll this supergroup', 'গ্রুপে protection চালু করুন'],
  ['doctor', 'Check setup and permissions', 'Setup ও permission পরীক্ষা'],
  ['status', 'Show protection settings', 'Protection-এর অবস্থা'],
  ['incidents', 'Show recent group incidents', 'সাম্প্রতিক ঘটনা দেখুন'],
  ['mode', 'Set observe or enforce mode', 'observe বা enforce mode'],
  ['gate', 'Toggle the new-member chat gate', 'নতুন member verification'],
  ['vc', 'Toggle the optional voice adapter', 'Optional VC adapter'],
  ['vclock', 'Toggle join-muted incident policy', 'VC join-muted policy'],
  ['disable', 'Disable protection in this group', 'গ্রুপের protection বন্ধ করুন']
];

// Menus improve discovery; every command still checks actual authority at execution.
export async function configureCommandMenus(api) {
  for (const language_code of ['', 'bn']) {
    const all = entries.map(([command, en, bn]) => ({ command, description: language_code ? bn : en }));
    for (const type of ['default', 'all_private_chats', 'all_chat_administrators']) {
      await api.setMyCommands(type === 'all_chat_administrators' ? all : all.slice(0, 5),
        { scope: { type }, language_code });
    }
  }
}
