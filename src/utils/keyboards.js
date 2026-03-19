// Builds inline keyboards matching the Group Help bot screenshots

function mainSettingsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📋 Regulation', callback_data: 'settings:regulation' },
        { text: '📩 Anti-Spam', callback_data: 'settings:antispam' }
      ],
      [
        { text: '👋 Welcome', callback_data: 'settings:welcome' },
        { text: '🌧 Anti-Flood', callback_data: 'settings:antiflood' }
      ],
      [
        { text: '👋 Goodbye 🆕', callback_data: 'settings:goodbye' },
        { text: '🕉 Alphabets', callback_data: 'settings:alphabets' }
      ],
      [
        { text: '🧠 Captcha', callback_data: 'settings:captcha' },
        { text: '🔍 Checks 🆕', callback_data: 'settings:checks' }
      ],
      [
        { text: '🆘 @Admin', callback_data: 'settings:admin' },
        { text: '🔒 Blocks', callback_data: 'settings:blocks' }
      ],
      [
        { text: '🎬 Media', callback_data: 'settings:media' },
        { text: '🔞 Porn', callback_data: 'settings:porn' }
      ],
      [
        { text: '❗ Warns', callback_data: 'settings:warns' },
        { text: '🌙 Night', callback_data: 'settings:night' }
      ],
      [
        { text: '🔔 Tag', callback_data: 'settings:tag' },
        { text: '🔗 Link', callback_data: 'settings:link' }
      ],
      [
        { text: '🔐 Approval mode', callback_data: 'settings:approval' }
      ],
      [
        { text: '🗑 Deleting Messages', callback_data: 'settings:deleting' }
      ],
      [
        { text: '🇬🇧 Lang', callback_data: 'settings:lang' },
        { text: '✅ Close', callback_data: 'settings:close' },
        { text: '▶️ Other', callback_data: 'settings:other' }
      ]
    ]
  };
}

function otherSettingsKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '📁 Topic', callback_data: 'settings:topic' }],
      [{ text: '🔤 Banned Words', callback_data: 'settings:bannedwords' }],
      [{ text: '⏰ Recurring messages', callback_data: 'settings:recurring' }],
      [{ text: '👥 Members Management', callback_data: 'settings:members' }],
      [{ text: '🤖 Masked users', callback_data: 'settings:masked' }],
      [{ text: '📣 Discussion group 🆕', callback_data: 'settings:discussion' }],
      [{ text: '📱 Personal Commands', callback_data: 'settings:personal' }],
      [{ text: '🎭 Magic Stickers&GIFs', callback_data: 'settings:magic' }],
      [{ text: '✏️ Message length', callback_data: 'settings:msglength' }],
      [{ text: '📢 Channels management 🆕', callback_data: 'settings:channels' }],
      [
        { text: '✏️ Permissions', callback_data: 'settings:permissions' },
        { text: '🔍 Log Channel', callback_data: 'settings:logchannel' }
      ],
      [
        { text: '◀️ Back', callback_data: 'settings:back_main' },
        { text: '✅ Close', callback_data: 'settings:close' },
        { text: '🇬🇧 Lang', callback_data: 'settings:lang' }
      ]
    ]
  };
}

function regulationKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '✍️ Customize message', callback_data: 'reg:customize' }],
      [{ text: '🚨 Commands Permissions', callback_data: 'reg:permissions' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function antispamKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '📘 Telegram links', callback_data: 'antispam:telegram_links' }],
      [
        { text: '📨 Forwarding', callback_data: 'antispam:forwarding' },
        { text: '💬 Quote', callback_data: 'antispam:quote' }
      ],
      [{ text: '🔗 Total links block', callback_data: 'antispam:total_links' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function antifloodKeyboard(settings) {
  const s = settings.antiflood;
  return {
    inline_keyboard: [
      [
        { text: '📄 Messages', callback_data: 'flood:messages' },
        { text: '⏰ Time', callback_data: 'flood:time' }
      ],
      [
        { text: `❌ Off${s.punishment === 'off' ? ' ✓' : ''}`, callback_data: 'flood:off' },
        { text: `❗ Warn${s.punishment === 'warn' ? ' ✓' : ''}`, callback_data: 'flood:warn' }
      ],
      [
        { text: `❗ Kick${s.punishment === 'kick' ? ' ✓' : ''}`, callback_data: 'flood:kick' },
        { text: `🔇 Mute${s.punishment === 'mute' ? ' ✓' : ''}`, callback_data: 'flood:mute' },
        { text: `🚫 Ban${s.punishment === 'ban' ? ' ✓' : ''}`, callback_data: 'flood:ban' }
      ],
      [{ text: `🗑 Delete Messages${s.deleteMessages ? ' ✓' : ''}`, callback_data: 'flood:delete_messages' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function welcomeKeyboard(settings) {
  const s = settings.welcome;
  return {
    inline_keyboard: [
      [
        { text: `❌ Turn off${!s.enabled ? ' ✓' : ''}`, callback_data: 'welcome:off' },
        { text: `✓ Turn on${s.enabled ? ' ✓' : ''}`, callback_data: 'welcome:on' }
      ],
      [{ text: '✍️ Customize message', callback_data: 'welcome:customize' }],
      [{ text: `🗑 Delete last message${s.deleteLastMessage ? ' ✓' : ' ❌'}`, callback_data: 'welcome:delete_last' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function goodbyeKeyboard(settings) {
  const s = settings.goodbye;
  return {
    inline_keyboard: [
      [
        { text: `❌ Turn off${!s.enabled ? ' ✓' : ''}`, callback_data: 'goodbye:off' },
        { text: `✓ Turn on${s.enabled ? ' ✓' : ''}`, callback_data: 'goodbye:on' }
      ],
      [{ text: '✍️ Customize message', callback_data: 'goodbye:customize' }],
      [{ text: `💌 Send in private chat${s.sendPrivate ? ' ✓' : ' ❌'}`, callback_data: 'goodbye:private' }],
      [{ text: `♻️ Delete last message${s.deleteLastMessage ? ' ✓' : ' ❌'}`, callback_data: 'goodbye:delete_last' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function alphabetsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🕌 ARABIC', callback_data: 'alpha:arabic' },
        { text: '🇷🇺 CYRILLIC', callback_data: 'alpha:cyrillic' }
      ],
      [
        { text: '🇨🇳 CHINESE', callback_data: 'alpha:chinese' },
        { text: '🔤 LATIN', callback_data: 'alpha:latin' }
      ],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function alphabetSubKeyboard(type, settings) {
  const enabled = settings.alphabets[type]?.enabled;
  const punishment = settings.alphabets[type]?.punishment || 'deletion';
  return {
    inline_keyboard: [
      [
        { text: `❌ Turn off${!enabled ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:off` },
        { text: `✓ Turn on${enabled ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:on` }
      ],
      [{ text: `❗ Warn${punishment === 'warn' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:warn` }],
      [{ text: `❗ Kick${punishment === 'kick' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:kick` }],
      [{ text: `🔇 Mute${punishment === 'mute' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:mute` }],
      [{ text: `🚫 Ban${punishment === 'ban' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:ban` }],
      [{ text: `🗑 Deletion${punishment === 'deletion' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:deletion` }],
      [{ text: '◀️ Back', callback_data: 'settings:alphabets' }]
    ]
  };
}

function captchaKeyboard(settings) {
  return {
    inline_keyboard: [
      [{ text: `✅ Activate`, callback_data: 'captcha:activate' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function captchaActiveKeyboard(settings) {
  const s = settings.captcha;
  return {
    inline_keyboard: [
      [
        { text: '❌ Deactivate', callback_data: 'captcha:deactivate' },
        { text: '⏱ Timeout', callback_data: 'captcha:timeout' }
      ],
      [{ text: '🛡 Punishment', callback_data: 'captcha:punishment' }],
      [{ text: `🗑 Delete service msg${s.deleteServiceMessage ? ' ✓' : ' ❌'}`, callback_data: 'captcha:delete_service' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function checksKeyboard(settings) {
  const s = settings.checks;
  return {
    inline_keyboard: [
      [
        { text: '📋 OBLIGATIONS', callback_data: 'checks:obligations' },
        { text: '🚫 NAME BLOCKS', callback_data: 'checks:name_blocks' }
      ],
      [{ text: `📋 Check at the join${s.checkAtJoin ? ' ✓' : ' ❌'}`, callback_data: 'checks:check_join' }],
      [{ text: `🗑 Delete Messages${s.deleteMessages ? ' ✓' : ' ❌'}`, callback_data: 'checks:delete_messages' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function adminReportKeyboard(settings) {
  const s = settings.adminReport;
  return {
    inline_keyboard: [
      [
        { text: `❌ Nobody${s.sendTo === 'nobody' ? ' ✓' : ''}`, callback_data: 'admin:nobody' },
        { text: `👑 Founder${s.sendTo === 'founder' ? ' ✓' : ''}`, callback_data: 'admin:founder' }
      ],
      [{ text: '👥 Staff Group', callback_data: 'admin:staff_group' }],
      [{ text: `🔔 Tag Founder${s.tagFounder ? ' ✓' : ' ❌'}`, callback_data: 'admin:tag_founder' }],
      [{ text: `🔔 Tag Admins${s.tagAdmins ? ' ✓' : ' ❌'}`, callback_data: 'admin:tag_admins' }],
      [{ text: '🔧 Advanced settings 🆕', callback_data: 'admin:advanced' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function blocksKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🔥 Blacklist', callback_data: 'blocks:blacklist' }],
      [{ text: '🤖 Bot block', callback_data: 'blocks:bot' }],
      [{ text: '🧍 Join block 🆕', callback_data: 'blocks:join' }],
      [{ text: '📕 Leave block 🆕', callback_data: 'blocks:leave' }],
      [{ text: '🏃 Join-Leave block', callback_data: 'blocks:joinleave' }],
      [{ text: '👥 Multiple joins block', callback_data: 'blocks:multijoins' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function mediaKeyboard(settings) {
  const s = settings.media;
  const mediaTypes = [
    ['story', '📱'], ['photo', '📸'], ['video', '🎬'],
    ['album', '🖼'], ['gif', '🎞'], ['voice', '🎙'],
    ['audio', '🎧'], ['sticker', '🃏'], ['animatedStickers', '🎭'],
    ['animatedGames', '🎲'], ['animatedEmoji', '😀'], ['premiumEmoji', '💎'],
    ['file', '📎']
  ];

  const punishments = ['off', 'warn', 'kick', 'mute', 'ban', 'deletion'];

  const rows = mediaTypes.map(([type, emoji]) => {
    const cur = s[type] || 'off';
    const punIcons = { 'off': '✅', 'warn': '❗', 'kick': '❗🔴', 'mute': '🔇', 'ban': '🚫', 'deletion': '🗑' };
    return [{ text: `${emoji} ${type}: ${punIcons[cur] || '✅'}`, callback_data: `media:${type}` }];
  });

  rows.push([{ text: '◀️ Back', callback_data: 'settings:back_main' }]);
  return { inline_keyboard: rows };
}

function mediaSubKeyboard(type, currentPunishment) {
  return {
    inline_keyboard: [
      [
        { text: `✅ Off${currentPunishment === 'off' ? ' ✓' : ''}`, callback_data: `media_set:${type}:off` },
        { text: `❗ Warn${currentPunishment === 'warn' ? ' ✓' : ''}`, callback_data: `media_set:${type}:warn` }
      ],
      [
        { text: `❗ Kick${currentPunishment === 'kick' ? ' ✓' : ''}`, callback_data: `media_set:${type}:kick` },
        { text: `🔇 Mute${currentPunishment === 'mute' ? ' ✓' : ''}`, callback_data: `media_set:${type}:mute` },
        { text: `🚫 Ban${currentPunishment === 'ban' ? ' ✓' : ''}`, callback_data: `media_set:${type}:ban` }
      ],
      [{ text: `🗑 Deletion${currentPunishment === 'deletion' ? ' ✓' : ''}`, callback_data: `media_set:${type}:deletion` }],
      [{ text: '◀️ Back', callback_data: 'settings:media' }]
    ]
  };
}

function warnsKeyboard(settings) {
  const s = settings.warns;
  const warnCounts = [2, 3, 4, 5, 6].map(n => ({
    text: `${n}${n === s.maxWarns ? ' ✅' : ''}`,
    callback_data: `warns:count:${n}`
  }));

  return {
    inline_keyboard: [
      [{ text: '📋 Warned List', callback_data: 'warns:list' }],
      [
        { text: `❌ Off${s.punishment === 'off' ? ' ✓' : ''}`, callback_data: 'warns:off' },
        { text: `❗ Kick${s.punishment === 'kick' ? ' ✓' : ''}`, callback_data: 'warns:kick' }
      ],
      [
        { text: `🔇 Mute${s.punishment === 'mute' ? ' ✓' : ''}`, callback_data: 'warns:mute' },
        { text: `🚫 Ban${s.punishment === 'ban' ? ' ✓' : ''}`, callback_data: 'warns:ban' }
      ],
      [{ text: '🔇⏱ Set mute duration', callback_data: 'warns:mute_duration' }],
      [warnCounts],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function nightModeKeyboard(settings) {
  const s = settings.nightMode;
  return {
    inline_keyboard: [
      [
        { text: `🎬 Delete medias${s.deleteMedias ? ' ✓' : ''}`, callback_data: 'night:delete_medias' },
        { text: `🤫 Global Silence${s.globalSilence ? ' ✓' : ''}`, callback_data: 'night:global_silence' }
      ],
      [
        { text: `❌ Turn off${!s.enabled ? ' ✓' : ''}`, callback_data: 'night:off' },
        { text: `✓ Turn on${s.enabled ? ' ✓' : ''}`, callback_data: 'night:on' }
      ],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function approvalKeyboard(settings) {
  const s = settings.approvalMode;
  return {
    inline_keyboard: [
      [{ text: `🔐 Auto-approval ⬇️`, callback_data: 'approval:info' }],
      [
        { text: `❌ Turn off${!s.autoApproval ? ' ✓' : ''}`, callback_data: 'approval:off' },
        { text: `✓ Turn on${s.autoApproval ? ' ✓' : ''}`, callback_data: 'approval:on' }
      ],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function deletingMessagesKeyboard(settings) {
  const s = settings.deletingMessages;
  return {
    inline_keyboard: [
      [{ text: `🤖 Commands${s.commands ? ' ✓' : ''}`, callback_data: 'deleting:commands' }],
      [{ text: `🤫 Global Silence${s.globalSilence ? ' ✓' : ''}`, callback_data: 'deleting:global_silence' }],
      [{ text: `✍️ Edit Checks${s.editChecks ? ' ✓' : ''}`, callback_data: 'deleting:edit_checks' }],
      [{ text: `💫 Service Messages${s.serviceMessages ? ' ✓' : ''}`, callback_data: 'deleting:service_messages' }],
      [{ text: `⏱ Scheduled deletion${s.scheduledDeletion ? ' ✓' : ''}`, callback_data: 'deleting:scheduled' }],
      [{ text: `📋 Block cancellation${s.blockCancellation ? ' ✓' : ''}`, callback_data: 'deleting:block_cancel' }],
      [{ text: '💥 Delete all messages', callback_data: 'deleting:delete_all' }],
      [{ text: '♻️ Messages self-destruction', callback_data: 'deleting:self_destruct' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function backKeyboard(backData = 'settings:back_main') {
  return {
    inline_keyboard: [[{ text: '◀️ Back', callback_data: backData }]]
  };
}

module.exports = {
  mainSettingsKeyboard,
  otherSettingsKeyboard,
  regulationKeyboard,
  antispamKeyboard,
  antifloodKeyboard,
  welcomeKeyboard,
  goodbyeKeyboard,
  alphabetsKeyboard,
  alphabetSubKeyboard,
  captchaKeyboard,
  captchaActiveKeyboard,
  checksKeyboard,
  adminReportKeyboard,
  blocksKeyboard,
  mediaKeyboard,
  mediaSubKeyboard,
  warnsKeyboard,
  nightModeKeyboard,
  approvalKeyboard,
  deletingMessagesKeyboard,
  backKeyboard
};
