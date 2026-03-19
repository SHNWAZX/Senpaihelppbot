const { getGroupSettings, isAdmin, formatOnOff } = require('../utils/helpers');
const keyboards = require('../utils/keyboards');
const GroupSettings = require('../models/GroupSettings');

async function handleSettingsCommand(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.chat.type === 'private') {
    return bot.sendMessage(chatId,
      '⚙️ *SenpaiHelpBot Settings*\n\nAdd me to a group and use /settings there!',
      { parse_mode: 'Markdown' }
    );
  }

  if (!(await isAdmin(bot, chatId, userId))) {
    return bot.sendMessage(chatId, '❌ Only admins can access settings.');
  }

  const settings = await getGroupSettings(chatId);
  const groupName = msg.chat.title || 'Group';

  return bot.sendMessage(chatId,
    `⚙️ *SETTINGS*\n*Group:* ${groupName}\n\n_Select one of the settings that you want to change._`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboards.mainSettingsKeyboard()
    }
  );
}

async function handleCallback(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const userId = query.from.id;
  const data = query.data;

  // Verify admin
  if (!(await isAdmin(bot, chatId, userId))) {
    return bot.answerCallbackQuery(query.id, { text: '❌ Only admins!', show_alert: true });
  }

  const settings = await getGroupSettings(chatId);

  // Helper: edit message
  const edit = (text, keyboard) => bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });

  const groupName = query.message.chat.title || 'Group';

  // ── MAIN NAVIGATION ──────────────────────────────────────────
  if (data === 'settings:back_main') {
    return edit(
      `⚙️ *SETTINGS*\n*Group:* ${groupName}\n\n_Select one of the settings that you want to change._`,
      keyboards.mainSettingsKeyboard()
    );
  }

  if (data === 'settings:close') {
    await bot.deleteMessage(chatId, messageId).catch(() => {});
    return bot.answerCallbackQuery(query.id);
  }

  if (data === 'settings:other') {
    return edit(
      `⚙️ *Other Settings*\n*Group:* ${groupName}\n\nSelect a setting to configure:`,
      keyboards.otherSettingsKeyboard()
    );
  }

  if (data === 'settings:back_other') {
    return edit(
      `⚙️ *Other Settings*\n*Group:* ${groupName}\n\nSelect a setting to configure:`,
      keyboards.otherSettingsKeyboard()
    );
  }

  // ── REGULATION ───────────────────────────────────────────────
  if (data === 'settings:regulation') {
    return edit(
      `📋 *Group's regulations*\nFrom this menu you can manage the group's regulations, that will be shown with the command /rules.\n\n_To edit who can use the /rules command, go to the "Commands permissions" section._`,
      keyboards.regulationKeyboard()
    );
  }

  if (data === 'reg:customize') {
    await bot.answerCallbackQuery(query.id);
    return bot.sendMessage(chatId,
      '✍️ Send the new rules message for this group (or /cancel to abort):',
      { reply_markup: { force_reply: true } }
    );
  }

  if (data === 'reg:permissions') {
    return edit('🚨 *Commands Permissions*\n\nComing soon.', keyboards.backKeyboard('settings:regulation'));
  }

  // ── ANTI-SPAM ─────────────────────────────────────────────────
  if (data === 'settings:antispam') {
    const s = settings.antispam;
    return edit(
      `📩 *Anti-Spam*\nIn this menu you can decide whether to protect your groups from unnecessary links, forwards, and quotes.\n\n` +
      `• Telegram links: ${formatOnOff(s.telegramLinks)}\n` +
      `• Forwarding: ${formatOnOff(s.forwarding)}\n` +
      `• Quote: ${formatOnOff(s.quotes)}\n` +
      `• Total links block: ${formatOnOff(s.totalLinksBlock)}`,
      keyboards.antispamKeyboard()
    );
  }

  if (data.startsWith('antispam:')) {
    const action = data.split(':')[1];
    const fieldMap = {
      'telegram_links': 'telegramLinks',
      'forwarding': 'forwarding',
      'quote': 'quotes',
      'total_links': 'totalLinksBlock'
    };
    const field = fieldMap[action];
    if (field) {
      settings.antispam[field] = !settings.antispam[field];
      await settings.save();
      await bot.answerCallbackQuery(query.id, { text: `${field}: ${settings.antispam[field] ? 'ON' : 'OFF'}` });
      const s = settings.antispam;
      return edit(
        `📩 *Anti-Spam*\nIn this menu you can decide whether to protect your groups from unnecessary links, forwards, and quotes.\n\n` +
        `• Telegram links: ${formatOnOff(s.telegramLinks)}\n` +
        `• Forwarding: ${formatOnOff(s.forwarding)}\n` +
        `• Quote: ${formatOnOff(s.quotes)}\n` +
        `• Total links block: ${formatOnOff(s.totalLinksBlock)}`,
        keyboards.antispamKeyboard()
      );
    }
  }

  // ── ANTI-FLOOD ────────────────────────────────────────────────
  if (data === 'settings:antiflood') {
    const s = settings.antiflood;
    const status = s.punishment === 'off' ? '❌ Off' : `✅ On`;
    return edit(
      `🌧 *Antiflood*\nFrom this menu you can set a punishment for those who send many messages in a short time.\n\n` +
      `Currently the antiflood is triggered when *${s.messages} messages* are sent within *${s.timeSeconds} seconds*.\n\n` +
      `*Punishment:* ${s.punishment.charAt(0).toUpperCase() + s.punishment.slice(1)}`,
      keyboards.antifloodKeyboard(settings)
    );
  }

  if (data.startsWith('flood:')) {
    const action = data.split(':')[1];
    if (['off', 'warn', 'kick', 'mute', 'ban', 'deletion'].includes(action)) {
      settings.antiflood.punishment = action;
      settings.antiflood.enabled = action !== 'off';
      await settings.save();
      await bot.answerCallbackQuery(query.id, { text: `Punishment set to: ${action}` });
    } else if (action === 'delete_messages') {
      settings.antiflood.deleteMessages = !settings.antiflood.deleteMessages;
      await settings.save();
      await bot.answerCallbackQuery(query.id, { text: `Delete messages: ${settings.antiflood.deleteMessages ? 'ON' : 'OFF'}` });
    } else if (action === 'messages') {
      await bot.answerCallbackQuery(query.id);
      return bot.sendMessage(chatId, '📄 Send the number of messages to trigger antiflood (e.g. 5):', { reply_markup: { force_reply: true } });
    } else if (action === 'time') {
      await bot.answerCallbackQuery(query.id);
      return bot.sendMessage(chatId, '⏰ Send the time window in seconds (e.g. 3):', { reply_markup: { force_reply: true } });
    }
    const s = settings.antiflood;
    return edit(
      `🌧 *Antiflood*\nFrom this menu you can set a punishment for those who send many messages in a short time.\n\n` +
      `Currently the antiflood is triggered when *${s.messages} messages* are sent within *${s.timeSeconds} seconds*.\n\n` +
      `*Punishment:* ${s.punishment.charAt(0).toUpperCase() + s.punishment.slice(1)}`,
      keyboards.antifloodKeyboard(settings)
    );
  }

  // ── WELCOME ───────────────────────────────────────────────────
  if (data === 'settings:welcome') {
    const s = settings.welcome;
    return edit(
      `👋 *Welcome*\nFrom this menu you can set a welcome message that will be sent when someone joins the group.\n\n` +
      `*Status:* ${formatOnOff(s.enabled)}`,
      keyboards.welcomeKeyboard(settings)
    );
  }

  if (data.startsWith('welcome:')) {
    const action = data.split(':')[1];
    if (action === 'on') { settings.welcome.enabled = true; await settings.save(); }
    else if (action === 'off') { settings.welcome.enabled = false; await settings.save(); }
    else if (action === 'delete_last') { settings.welcome.deleteLastMessage = !settings.welcome.deleteLastMessage; await settings.save(); }
    else if (action === 'customize') {
      await bot.answerCallbackQuery(query.id);
      return bot.sendMessage(chatId, '✍️ Send the new welcome message (use {user} for mention, {group} for group name):', { reply_markup: { force_reply: true } });
    }
    await bot.answerCallbackQuery(query.id);
    const s = settings.welcome;
    return edit(
      `👋 *Welcome*\nFrom this menu you can set a welcome message that will be sent when someone joins the group.\n\n*Status:* ${formatOnOff(s.enabled)}`,
      keyboards.welcomeKeyboard(settings)
    );
  }

  // ── GOODBYE ───────────────────────────────────────────────────
  if (data === 'settings:goodbye') {
    const s = settings.goodbye;
    return edit(
      `👋 *Goodbye*\nFrom this menu you can set a goodbye message that will be sent when someone leaves the group.\n\n*Status:* ${formatOnOff(s.enabled)}`,
      keyboards.goodbyeKeyboard(settings)
    );
  }

  if (data.startsWith('goodbye:')) {
    const action = data.split(':')[1];
    if (action === 'on') { settings.goodbye.enabled = true; await settings.save(); }
    else if (action === 'off') { settings.goodbye.enabled = false; await settings.save(); }
    else if (action === 'private') { settings.goodbye.sendPrivate = !settings.goodbye.sendPrivate; await settings.save(); }
    else if (action === 'delete_last') { settings.goodbye.deleteLastMessage = !settings.goodbye.deleteLastMessage; await settings.save(); }
    else if (action === 'customize') {
      await bot.answerCallbackQuery(query.id);
      return bot.sendMessage(chatId, '✍️ Send the new goodbye message (use {user} for mention):', { reply_markup: { force_reply: true } });
    }
    await bot.answerCallbackQuery(query.id);
    const s = settings.goodbye;
    return edit(
      `👋 *Goodbye*\nFrom this menu you can set a goodbye message.\n\n*Status:* ${formatOnOff(s.enabled)}`,
      keyboards.goodbyeKeyboard(settings)
    );
  }

  // ── ALPHABETS ─────────────────────────────────────────────────
  if (data === 'settings:alphabets') {
    const s = settings.alphabets;
    return edit(
      `🕉 *Alphabets*\nSelect punishment for any user who send messages written in certain alphabets.\n\n` +
      `🕌 Arabic (?) \n└ *Status:* ${formatOnOff(s.arabic.enabled)}\n` +
      `🇷🇺 Cyrillic (?) \n└ *Status:* ${formatOnOff(s.cyrillic.enabled)}\n` +
      `🇨🇳 Chinese (?) \n└ *Status:* ${formatOnOff(s.chinese.enabled)}\n` +
      `🔤 Latin (?) \n└ *Status:* ${formatOnOff(s.latin.enabled)}`,
      keyboards.alphabetsKeyboard()
    );
  }

  if (data.startsWith('alpha:')) {
    const type = data.split(':')[1];
    const s = settings.alphabets[type];
    return edit(
      `🕉 *Alphabets - ${type.charAt(0).toUpperCase() + type.slice(1)}*\n\n*Status:* ${formatOnOff(s?.enabled)}\n*Punishment:* ${s?.punishment || 'deletion'}`,
      keyboards.alphabetSubKeyboard(type, settings)
    );
  }

  if (data.startsWith('alpha_sub:')) {
    const parts = data.split(':');
    const type = parts[1];
    const action = parts[2];
    if (action === 'on') settings.alphabets[type].enabled = true;
    else if (action === 'off') settings.alphabets[type].enabled = false;
    else settings.alphabets[type].punishment = action;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    const s = settings.alphabets[type];
    return edit(
      `🕉 *Alphabets - ${type.charAt(0).toUpperCase() + type.slice(1)}*\n\n*Status:* ${formatOnOff(s?.enabled)}\n*Punishment:* ${s?.punishment || 'deletion'}`,
      keyboards.alphabetSubKeyboard(type, settings)
    );
  }

  // ── CAPTCHA ───────────────────────────────────────────────────
  if (data === 'settings:captcha') {
    const s = settings.captcha;
    const kb = s.enabled ? keyboards.captchaActiveKeyboard(settings) : keyboards.captchaKeyboard(settings);
    return edit(
      `🧠 *Captcha*\nBy activating the captcha, when a user enters the group he *will not be able to send messages* until he has confirmed that he is *not a robot*.\n\n` +
      `⏱ You can also decide to set a *PUNISHMENT* for those who *will not resolve* the captcha within the *desired time*.\n\n` +
      `*Status:* ${formatOnOff(s.enabled)}`,
      kb
    );
  }

  if (data === 'captcha:activate') {
    settings.captcha.enabled = true;
    await settings.save();
    await bot.answerCallbackQuery(query.id, { text: 'Captcha activated!' });
    return edit(
      `🧠 *Captcha*\n*Status:* ✅ On`,
      keyboards.captchaActiveKeyboard(settings)
    );
  }

  if (data === 'captcha:deactivate') {
    settings.captcha.enabled = false;
    await settings.save();
    await bot.answerCallbackQuery(query.id, { text: 'Captcha deactivated!' });
    return edit(
      `🧠 *Captcha*\n*Status:* ❌ Off`,
      keyboards.captchaKeyboard(settings)
    );
  }

  if (data === 'captcha:delete_service') {
    settings.captcha.deleteServiceMessage = !settings.captcha.deleteServiceMessage;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    return edit(
      `🧠 *Captcha*\n*Status:* ${formatOnOff(settings.captcha.enabled)}`,
      keyboards.captchaActiveKeyboard(settings)
    );
  }

  // ── CHECKS ────────────────────────────────────────────────────
  if (data === 'settings:checks') {
    const s = settings.checks;
    return edit(
      `🔍 *Checks*\n\n*OBLIGATION OF...*\n` +
      `• Surname: ${formatOnOff(s.obligations.surname)}\n` +
      `• Username: ${formatOnOff(s.obligations.username)}\n` +
      `• Profile picture: ${formatOnOff(s.obligations.profilePicture)}\n` +
      `• Channel obligation: ${formatOnOff(s.obligations.channelObligation)}\n` +
      `• Obligation to add: ${formatOnOff(s.obligations.obligationToAdd)}\n\n` +
      `*BLOCK...*\n` +
      `• Arabic name: ${formatOnOff(s.nameBlocks.arabic)}\n` +
      `• Chinese name: ${formatOnOff(s.nameBlocks.chinese)}\n` +
      `• Russian name: ${formatOnOff(s.nameBlocks.russian)}\n` +
      `• Spam name: ${formatOnOff(s.nameBlocks.spam)}\n\n` +
      `*Check at join:* ${formatOnOff(s.checkAtJoin)}\n` +
      `*Delete Messages:* ${formatOnOff(s.deleteMessages)}`,
      keyboards.checksKeyboard(settings)
    );
  }

  if (data === 'checks:check_join') {
    settings.checks.checkAtJoin = !settings.checks.checkAtJoin;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    return edit(
      `🔍 *Checks*\nCheck at join: ${formatOnOff(settings.checks.checkAtJoin)}`,
      keyboards.checksKeyboard(settings)
    );
  }

  if (data === 'checks:delete_messages') {
    settings.checks.deleteMessages = !settings.checks.deleteMessages;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    return edit(
      `🔍 *Checks*\nDelete messages: ${formatOnOff(settings.checks.deleteMessages)}`,
      keyboards.checksKeyboard(settings)
    );
  }

  if (data === 'checks:obligations') {
    return edit('📋 *Obligations*\nComing soon - will allow you to require users to have surname, username, etc.', keyboards.backKeyboard('settings:checks'));
  }

  if (data === 'checks:name_blocks') {
    return edit('🚫 *Name Blocks*\nComing soon - will block users with certain name types.', keyboards.backKeyboard('settings:checks'));
  }

  // ── ADMIN REPORT ──────────────────────────────────────────────
  if (data === 'settings:admin') {
    const s = settings.adminReport;
    return edit(
      `🆘 *@Admin command*\nThe @admin (or /report) is a command available to users to attract the attention of the group's staff.\n\n` +
      `From this menu you can set where you want the reports made by users to be sent.\n\n` +
      `⚠️ The @admin command *DOES NOT* work when used by Admins or Mods.\n\n` +
      `*Status:* ${formatOnOff(s.enabled)}\n*Send to:* ${s.sendTo === 'founder' ? '👑 Founder' : '❌ Nobody'}`,
      keyboards.adminReportKeyboard(settings)
    );
  }

  if (data === 'admin:nobody') {
    settings.adminReport.sendTo = 'nobody';
    settings.adminReport.enabled = false;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    return edit(
      `🆘 *@Admin command*\n*Status:* ❌ Off\n*Send to:* Nobody`,
      keyboards.adminReportKeyboard(settings)
    );
  }

  if (data === 'admin:founder') {
    settings.adminReport.sendTo = 'founder';
    settings.adminReport.enabled = true;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    return edit(
      `🆘 *@Admin command*\n*Status:* ✅ Active\n*Send to:* 👑 Founder`,
      keyboards.adminReportKeyboard(settings)
    );
  }

  if (data === 'admin:tag_founder') {
    settings.adminReport.tagFounder = !settings.adminReport.tagFounder;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    return edit(
      `🆘 *@Admin command*\n*Tag Founder:* ${formatOnOff(settings.adminReport.tagFounder)}`,
      keyboards.adminReportKeyboard(settings)
    );
  }

  if (data === 'admin:tag_admins') {
    settings.adminReport.tagAdmins = !settings.adminReport.tagAdmins;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    return edit(
      `🆘 *@Admin command*\n*Tag Admins:* ${formatOnOff(settings.adminReport.tagAdmins)}`,
      keyboards.adminReportKeyboard(settings)
    );
  }

  if (data === 'admin:advanced') {
    return edit('🔧 *Advanced Settings*\nComing soon.', keyboards.backKeyboard('settings:admin'));
  }

  if (data === 'admin:staff_group') {
    return edit('👥 *Staff Group*\nComing soon - forward reports to a specific staff group.', keyboards.backKeyboard('settings:admin'));
  }

  // ── BLOCKS ────────────────────────────────────────────────────
  if (data === 'settings:blocks') {
    const s = settings.blocks;
    return edit(
      `🔒 *Blocks*\n\n• Bot block: ${formatOnOff(s.botBlock)}\n• Join block: ${formatOnOff(s.joinBlock)}\n• Leave block: ${formatOnOff(s.leaveBlock)}\n• Join-Leave block: ${formatOnOff(s.joinLeaveBlock)}\n• Multiple joins block: ${formatOnOff(s.multipleJoinsBlock)}`,
      keyboards.blocksKeyboard()
    );
  }

  if (data === 'blocks:blacklist') {
    return edit(
      `🔥 *Blacklist*\nWords in the blacklist will be automatically deleted.\n\nCurrent blacklisted words: ${settings.blocks.blacklist?.words?.join(', ') || 'None'}\n\nUse /addblacklist <word> or /removeblacklist <word>`,
      keyboards.backKeyboard('settings:blocks')
    );
  }

  if (data === 'blocks:bot') {
    settings.blocks.botBlock = !settings.blocks.botBlock;
    await settings.save();
    await bot.answerCallbackQuery(query.id, { text: `Bot block: ${settings.blocks.botBlock ? 'ON' : 'OFF'}` });
    return edit(`🤖 *Bot Block*\n*Status:* ${formatOnOff(settings.blocks.botBlock)}`, keyboards.backKeyboard('settings:blocks'));
  }

  if (data === 'blocks:join') {
    settings.blocks.joinBlock = !settings.blocks.joinBlock;
    await settings.save();
    await bot.answerCallbackQuery(query.id, { text: `Join block: ${settings.blocks.joinBlock ? 'ON' : 'OFF'}` });
    return edit(`🧍 *Join Block*\n*Status:* ${formatOnOff(settings.blocks.joinBlock)}`, keyboards.backKeyboard('settings:blocks'));
  }

  if (data === 'blocks:leave') {
    settings.blocks.leaveBlock = !settings.blocks.leaveBlock;
    await settings.save();
    await bot.answerCallbackQuery(query.id, { text: `Leave block: ${settings.blocks.leaveBlock ? 'ON' : 'OFF'}` });
    return edit(`📕 *Leave Block*\n*Status:* ${formatOnOff(settings.blocks.leaveBlock)}`, keyboards.backKeyboard('settings:blocks'));
  }

  if (data === 'blocks:joinleave') {
    settings.blocks.joinLeaveBlock = !settings.blocks.joinLeaveBlock;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    return edit(`🏃 *Join-Leave Block*\n*Status:* ${formatOnOff(settings.blocks.joinLeaveBlock)}`, keyboards.backKeyboard('settings:blocks'));
  }

  if (data === 'blocks:multijoins') {
    settings.blocks.multipleJoinsBlock = !settings.blocks.multipleJoinsBlock;
    await settings.save();
    await bot.answerCallbackQuery(query.id);
    return edit(`👥 *Multiple Joins Block*\n*Status:* ${formatOnOff(settings.blocks.multipleJoinsBlock)}`, keyboards.backKeyboard('settings:blocks'));
  }

  // ── MEDIA ─────────────────────────────────────────────────────
  if (data === 'settings:media') {
    const s = settings.media;
    const lines = Object.entries(s.toObject ? s.toObject() : s)
      .map(([k, v]) => `• ${k}: ${v === 'off' ? '✅ Off' : v}`)
      .join('\n');
    return edit(
      `🎬 *Media Block*\n\n❗ = Warn | ❗🔴 = Kick\n🔇 = Mute | 🚫 = Ban\n🗑 = Deletion\n✅ = Off\n\n${lines}`,
      keyboards.mediaKeyboard(settings)
    );
  }

  if (data.startsWith('media:')) {
    const type = data.split(':')[1];
    const cur = settings.media[type] || 'off';
    return edit(
      `🎬 *Media - ${type}*\nCurrent: *${cur}*\n\nSelect punishment:`,
      keyboards.mediaSubKeyboard(type, cur)
    );
  }

  if (data.startsWith('media_set:')) {
    const parts = data.split(':');
    const type = parts[1];
    const punishment = parts[2];
    settings.media[type] = punishment;
    await settings.save();
    await bot.answerCallbackQuery(query.id, { text: `${type}: ${punishment}` });
    const cur = settings.media[type];
    return edit(
      `🎬 *Media - ${type}*\nCurrent: *${cur}*\n\nSelect punishment:`,
      keyboards.mediaSubKeyboard(type, cur)
    );
  }

  // ── WARNS ─────────────────────────────────────────────────────
  if (data === 'settings:warns') {
    const s = settings.warns;
    return edit(
      `❗ *User warnings*\nThe warning system allows you to give warnings to users for incorrect behavior in the group, before actually punishing them.\n\n` +
      `From this menu you can set:\n• the *punishment* for users who exceed the maximum of warnings allowed\n• the *maximum number* of warns allowed\n\n` +
      `*Punishment:* ${s.punishment.charAt(0).toUpperCase() + s.punishment.slice(1)}\n*Max Warns allowed:* ${s.maxWarns}`,
      keyboards.warnsKeyboard(settings)
    );
  }

  if (data.startsWith('warns:')) {
    const action = data.split(':')[1];
    if (action === 'off') { settings.warns.punishment = 'off'; await settings.save(); }
    else if (action === 'kick') { settings.warns.punishment = 'kick'; await settings.save(); }
    else if (action === 'mute') { settings.warns.punishment = 'mute'; await settings.save(); }
    else if (action === 'ban') { settings.warns.punishment = 'ban'; await settings.save(); }
    else if (action === 'count') {
      const count = parseInt(data.split(':')[2]);
      if (!isNaN(count)) { settings.warns.maxWarns = count; await settings.save(); }
    } else if (action === 'list') {
      const UserWarning = require('../models/UserWarning');
      const warnedUsers = await UserWarning.find({ chatId: String(chatId), warns: { $gt: 0 } });
      if (warnedUsers.length === 0) {
        await bot.answerCallbackQuery(query.id, { text: 'No warned users.', show_alert: true });
        return;
      }
      const list = warnedUsers.map(u => `• ${u.firstName || u.username}: ${u.warns}/${settings.warns.maxWarns} warns`).join('\n');
      return edit(`📋 *Warned Users*\n\n${list}`, keyboards.backKeyboard('settings:warns'));
    } else if (action === 'mute_duration') {
      await bot.answerCallbackQuery(query.id);
      return bot.sendMessage(chatId, '⏱ Send mute duration in minutes (0 = permanent):', { reply_markup: { force_reply: true } });
    }
    await bot.answerCallbackQuery(query.id);
    const s = settings.warns;
    return edit(
      `❗ *User warnings*\n*Punishment:* ${s.punishment}\n*Max Warns:* ${s.maxWarns}`,
      keyboards.warnsKeyboard(settings)
    );
  }

  // ── NIGHT MODE ────────────────────────────────────────────────
  if (data === 'settings:night') {
    const s = settings.nightMode;
    return edit(
      `🌙 *Night mode*\nSelect the actions you want to limit every night.\n\n*Status:* ${formatOnOff(s.enabled)}`,
      keyboards.nightModeKeyboard(settings)
    );
  }

  if (data.startsWith('night:')) {
    const action = data.split(':')[1];
    if (action === 'on') { settings.nightMode.enabled = true; await settings.save(); }
    else if (action === 'off') { settings.nightMode.enabled = false; await settings.save(); }
    else if (action === 'delete_medias') { settings.nightMode.deleteMedias = !settings.nightMode.deleteMedias; await settings.save(); }
    else if (action === 'global_silence') { settings.nightMode.globalSilence = !settings.nightMode.globalSilence; await settings.save(); }
    await bot.answerCallbackQuery(query.id);
    return edit(
      `🌙 *Night mode*\n*Status:* ${formatOnOff(settings.nightMode.enabled)}`,
      keyboards.nightModeKeyboard(settings)
    );
  }

  // ── PORN ──────────────────────────────────────────────────────
  if (data === 'settings:porn') {
    return edit(
      `🔞 *Porn*\nBlock adult content in the group.\n\n*Status:* ${formatOnOff(settings.porn?.enabled)}`,
      {
        inline_keyboard: [
          [
            { text: `❌ Off${!settings.porn?.enabled ? ' ✓' : ''}`, callback_data: 'porn:off' },
            { text: `✅ On${settings.porn?.enabled ? ' ✓' : ''}`, callback_data: 'porn:on' }
          ],
          [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
        ]
      }
    );
  }

  if (data === 'porn:on') { settings.porn.enabled = true; await settings.save(); await bot.answerCallbackQuery(query.id); return edit(`🔞 *Porn block*\n*Status:* ✅ On`, keyboards.backKeyboard('settings:back_main')); }
  if (data === 'porn:off') { settings.porn.enabled = false; await settings.save(); await bot.answerCallbackQuery(query.id); return edit(`🔞 *Porn block*\n*Status:* ❌ Off`, keyboards.backKeyboard('settings:back_main')); }

  // ── TAG ───────────────────────────────────────────────────────
  if (data === 'settings:tag') {
    return edit(`🔔 *Tag*\n*Status:* ${formatOnOff(settings.tag?.enabled)}`, {
      inline_keyboard: [
        [
          { text: `❌ Off${!settings.tag?.enabled ? ' ✓' : ''}`, callback_data: 'tag:off' },
          { text: `✅ On${settings.tag?.enabled ? ' ✓' : ''}`, callback_data: 'tag:on' }
        ],
        [{ text: '✍️ Customize message', callback_data: 'tag:customize' }],
        [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
      ]
    });
  }

  if (data === 'tag:on') { settings.tag.enabled = true; await settings.save(); await bot.answerCallbackQuery(query.id); }
  if (data === 'tag:off') { settings.tag.enabled = false; await settings.save(); await bot.answerCallbackQuery(query.id); }

  // ── LINK ──────────────────────────────────────────────────────
  if (data === 'settings:link') {
    return edit(`🔗 *Link*\nGroup invite link management.\n\n*Status:* ${formatOnOff(settings.link?.enabled)}`, {
      inline_keyboard: [
        [
          { text: `❌ Off${!settings.link?.enabled ? ' ✓' : ''}`, callback_data: 'link:off' },
          { text: `✅ On${settings.link?.enabled ? ' ✓' : ''}`, callback_data: 'link:on' }
        ],
        [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
      ]
    });
  }

  // ── APPROVAL ──────────────────────────────────────────────────
  if (data === 'settings:approval') {
    const s = settings.approvalMode;
    return edit(
      `🔐 *Approval mode*\nThrough this menu you can decide to delegate the management of group approvals to the bot.\n\n` +
      `🧠 Since the Captcha is ${settings.captcha.enabled ? 'active' : 'not active'}, if you enable Auto-approval, users will be automatically accepted into the group as soon as they make a request.\n\n` +
      `💡 *Status:*\n• Auto-approval: ${s.autoApproval ? 'Activated' : 'Deactivated'}`,
      keyboards.approvalKeyboard(settings)
    );
  }

  if (data === 'approval:on') { settings.approvalMode.autoApproval = true; await settings.save(); await bot.answerCallbackQuery(query.id, { text: 'Auto-approval: ON' }); }
  if (data === 'approval:off') { settings.approvalMode.autoApproval = false; await settings.save(); await bot.answerCallbackQuery(query.id, { text: 'Auto-approval: OFF' }); }
  if (data === 'approval:info') { await bot.answerCallbackQuery(query.id, { text: 'Auto-approval lets the bot handle join requests automatically.', show_alert: true }); return; }

  // ── DELETING MESSAGES ─────────────────────────────────────────
  if (data === 'settings:deleting') {
    return edit(
      `🗑 *Deleting Messages*\nWhat messages do you want the Bot to delete?`,
      keyboards.deletingMessagesKeyboard(settings)
    );
  }

  if (data.startsWith('deleting:')) {
    const action = data.split(':')[1];
    const fieldMap = {
      'commands': 'commands', 'global_silence': 'globalSilence',
      'edit_checks': 'editChecks', 'service_messages': 'serviceMessages',
      'scheduled': 'scheduledDeletion', 'block_cancel': 'blockCancellation'
    };
    const field = fieldMap[action];
    if (field) {
      settings.deletingMessages[field] = !settings.deletingMessages[field];
      await settings.save();
      await bot.answerCallbackQuery(query.id, { text: `${field}: ${settings.deletingMessages[field] ? 'ON' : 'OFF'}` });
    } else if (action === 'delete_all') {
      await bot.answerCallbackQuery(query.id, { text: '⚠️ This will delete all messages. Use with caution!', show_alert: true });
      return;
    } else if (action === 'self_destruct') {
      await bot.answerCallbackQuery(query.id, { text: 'Messages self-destruction coming soon!', show_alert: true });
      return;
    }
    return edit(
      `🗑 *Deleting Messages*\nWhat messages do you want the Bot to delete?`,
      keyboards.deletingMessagesKeyboard(settings)
    );
  }

  // ── LANGUAGE ──────────────────────────────────────────────────
  if (data === 'settings:lang') {
    return edit('🌐 *Language*\nCurrently only English is supported.', keyboards.backKeyboard('settings:back_main'));
  }

  // ── OTHER SETTINGS ────────────────────────────────────────────
  if (['settings:topic','settings:bannedwords','settings:recurring','settings:members',
    'settings:masked','settings:discussion','settings:personal','settings:magic',
    'settings:msglength','settings:channels','settings:permissions','settings:logchannel'].includes(data)) {
    const names = {
      'settings:topic': '📁 Topic',
      'settings:bannedwords': '🔤 Banned Words',
      'settings:recurring': '⏰ Recurring Messages',
      'settings:members': '👥 Members Management',
      'settings:masked': '🤖 Masked Users',
      'settings:discussion': '📣 Discussion Group',
      'settings:personal': '📱 Personal Commands',
      'settings:magic': '🎭 Magic Stickers & GIFs',
      'settings:msglength': '✏️ Message Length',
      'settings:channels': '📢 Channels Management',
      'settings:permissions': '✏️ Permissions',
      'settings:logchannel': '🔍 Log Channel'
    };
    return edit(`${names[data] || 'Setting'}\n\nThis feature is coming soon!`, keyboards.backKeyboard('settings:back_other'));
  }

  // Fallback
  await bot.answerCallbackQuery(query.id, { text: 'Processing...' });
}

module.exports = { handleSettingsCommand, handleCallback };
