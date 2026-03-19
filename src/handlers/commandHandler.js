const { isAdmin, isCreator, getGroupSettings, applyPunishment, getUserMention } = require('../utils/helpers');
const UserWarning = require('../models/UserWarning');
const { addWarn } = require('./moderationHandler');

async function handleCommands(bot, msg) {
  if (!msg.text) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const isPrivate = msg.chat.type === 'private';

  // ── /start ────────────────────────────────────────────────────
  if (text.startsWith('/start')) {
    if (isPrivate) {
      return bot.sendMessage(chatId,
        `👋 *Hello!*\n[SenpaiHelpBot](https://t.me/senpaihelppbot) is the most complete Bot to help you *manage* your groups easily and *safely*!\n\n` +
        `👉 *Add me in a Supergroup* and promote me as Admin to let me get in action!\n\n` +
        `❓ *WHICH ARE THE COMMANDS?* ❓\nPress /help to see *all the commands* and how they work!`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ Add me to a Group ➕', url: 'https://t.me/senpaihelppbot?startgroup=true' }],
              [{ text: '⚙️ Manage group Settings ✍️', callback_data: 'private:settings' }],
              [
                { text: '👥 Group', url: 'https://t.me/senpaihelppbot' },
                { text: '📢 Channel', url: 'https://t.me/senpaihelppbot' }
              ],
              [
                { text: '🆘 Support', url: 'https://t.me/senpaihelppbot' },
                { text: 'ℹ️ Information', callback_data: 'private:info' }
              ],
              [{ text: '🇬🇧 Languages 🇬🇧', callback_data: 'private:lang' }]
            ]
          }
        }
      );
    }
  }

  // ── /help ─────────────────────────────────────────────────────
  if (text.startsWith('/help')) {
    const helpText = `🆘 *SenpaiHelpBot Commands*\n\n` +
      `*👑 Admin Commands:*\n` +
      `/settings - Open group settings\n` +
      `/warn [reply] - Warn a user\n` +
      `/unwarn [reply] - Remove a warning\n` +
      `/warnlist - Show warned users\n` +
      `/ban [reply] - Ban a user\n` +
      `/unban [reply/username] - Unban a user\n` +
      `/kick [reply] - Kick a user\n` +
      `/mute [reply] - Mute a user\n` +
      `/unmute [reply] - Unmute a user\n` +
      `/addblacklist <word> - Add word to blacklist\n` +
      `/removeblacklist <word> - Remove from blacklist\n` +
      `/pin [reply] - Pin a message\n` +
      `/unpin - Unpin the current message\n\n` +
      `*👤 User Commands:*\n` +
      `/rules - Show group rules\n` +
      `@admin or /report - Report to admins\n` +
      `/id - Get your Telegram ID\n` +
      `/info [reply] - Get user info`;

    return bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  // ── /rules ────────────────────────────────────────────────────
  if (text.startsWith('/rules')) {
    const settings = await getGroupSettings(chatId);
    return bot.sendMessage(chatId, `📋 *Group Rules*\n\n${settings.regulation.message}`, { parse_mode: 'Markdown' });
  }

  // ── /id ───────────────────────────────────────────────────────
  if (text.startsWith('/id')) {
    const target = msg.reply_to_message?.from || msg.from;
    return bot.sendMessage(chatId, `🆔 *User ID:* \`${target.id}\`\n*Name:* ${target.first_name}`, { parse_mode: 'Markdown' });
  }

  // ── /info ─────────────────────────────────────────────────────
  if (text.startsWith('/info')) {
    const target = msg.reply_to_message?.from || msg.from;
    const mention = getUserMention(target);
    return bot.sendMessage(chatId,
      `ℹ️ *User Info*\n\n*Name:* ${target.first_name}${target.last_name ? ' ' + target.last_name : ''}\n*ID:* \`${target.id}\`\n*Username:* ${target.username ? '@' + target.username : 'None'}\n*Bot:* ${target.is_bot ? 'Yes' : 'No'}`,
      { parse_mode: 'Markdown' }
    );
  }

  // Skip non-admin commands for non-admins
  const adminCommands = ['/warn', '/unwarn', '/ban', '/unban', '/kick', '/mute', '/unmute', '/warnlist', '/addblacklist', '/removeblacklist', '/pin', '/unpin', '/settings'];
  const isAdminCommand = adminCommands.some(cmd => text.startsWith(cmd));
  if (isAdminCommand && !(await isAdmin(bot, chatId, userId))) {
    return bot.sendMessage(chatId, '❌ You need to be an admin to use this command.').then(m => {
      setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 5000);
    });
  }

  // ── @admin / /report ─────────────────────────────────────────
  if (text.includes('@admin') || text.startsWith('/report')) {
    const settings = await getGroupSettings(chatId);
    if (!settings.adminReport.enabled) return;

    // Don't work for admins
    if (await isAdmin(bot, chatId, userId)) {
      return bot.sendMessage(chatId, '⚠️ The @admin command does not work when used by admins.').then(m => {
        setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 5000);
      });
    }

    const reporter = msg.from;
    const reportMsg = msg.reply_to_message
      ? `Reported message: "${msg.reply_to_message.text || '[media]'}"`
      : 'General report';

    const alertText = `🆘 *Admin Report*\n\nFrom: ${getUserMention(reporter)}\nGroup: ${msg.chat.title}\n${reportMsg}`;

    if (settings.adminReport.sendTo === 'founder') {
      const admins = await bot.getChatAdministrators(chatId);
      const founder = admins.find(a => a.status === 'creator');
      if (founder) {
        bot.sendMessage(founder.user.id, alertText, { parse_mode: 'Markdown' }).catch(() => {});
      }
    }

    return bot.sendMessage(chatId, `✅ Report sent to admins.`).then(m => {
      setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 5000);
    });
  }

  // ── /warn ─────────────────────────────────────────────────────
  if (text.startsWith('/warn')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to warn the user.');
    const target = msg.reply_to_message.from;
    if (await isAdmin(bot, chatId, target.id)) return bot.sendMessage(chatId, '❌ Cannot warn admins.');
    const settings = await getGroupSettings(chatId);
    const reason = text.split(' ').slice(1).join(' ') || '';
    await addWarn(bot, chatId, target.id, target, settings, reason);
  }

  // ── /unwarn ───────────────────────────────────────────────────
  if (text.startsWith('/unwarn')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to remove a warning.');
    const target = msg.reply_to_message.from;
    const settings = await getGroupSettings(chatId);
    let userWarn = await UserWarning.findOne({ chatId: String(chatId), userId: String(target.id) });
    if (!userWarn || userWarn.warns === 0) return bot.sendMessage(chatId, `${target.first_name} has no warnings.`);
    userWarn.warns = Math.max(0, userWarn.warns - 1);
    await userWarn.save();
    return bot.sendMessage(chatId, `✅ Removed 1 warning from ${getUserMention(target)}. Now: ${userWarn.warns}/${settings.warns.maxWarns}`, { parse_mode: 'Markdown' });
  }

  // ── /warnlist ─────────────────────────────────────────────────
  if (text.startsWith('/warnlist')) {
    const warnedUsers = await UserWarning.find({ chatId: String(chatId), warns: { $gt: 0 } });
    if (warnedUsers.length === 0) return bot.sendMessage(chatId, '✅ No warned users.');
    const settings = await getGroupSettings(chatId);
    const list = warnedUsers.map(u => `• ${u.firstName || u.username || u.userId}: ${u.warns}/${settings.warns.maxWarns}`).join('\n');
    return bot.sendMessage(chatId, `📋 *Warned Users*\n\n${list}`, { parse_mode: 'Markdown' });
  }

  // ── /ban ──────────────────────────────────────────────────────
  if (text.startsWith('/ban')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to ban the user.');
    const target = msg.reply_to_message.from;
    if (await isAdmin(bot, chatId, target.id)) return bot.sendMessage(chatId, '❌ Cannot ban admins.');
    try {
      await bot.banChatMember(chatId, target.id);
      return bot.sendMessage(chatId, `🚫 ${getUserMention(target)} was banned.`, { parse_mode: 'Markdown' });
    } catch (e) {
      return bot.sendMessage(chatId, `❌ Failed to ban: ${e.message}`);
    }
  }

  // ── /unban ────────────────────────────────────────────────────
  if (text.startsWith('/unban')) {
    const username = text.split(' ')[1];
    if (!username) return bot.sendMessage(chatId, '❌ Usage: /unban @username');
    try {
      const user = await bot.getChatMember(chatId, username);
      await bot.unbanChatMember(chatId, user.user.id);
      return bot.sendMessage(chatId, `✅ ${getUserMention(user.user)} was unbanned.`, { parse_mode: 'Markdown' });
    } catch (e) {
      return bot.sendMessage(chatId, `❌ Failed to unban: ${e.message}`);
    }
  }

  // ── /kick ─────────────────────────────────────────────────────
  if (text.startsWith('/kick')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to kick the user.');
    const target = msg.reply_to_message.from;
    if (await isAdmin(bot, chatId, target.id)) return bot.sendMessage(chatId, '❌ Cannot kick admins.');
    try {
      await bot.banChatMember(chatId, target.id);
      await bot.unbanChatMember(chatId, target.id);
      return bot.sendMessage(chatId, `👟 ${getUserMention(target)} was kicked.`, { parse_mode: 'Markdown' });
    } catch (e) {
      return bot.sendMessage(chatId, `❌ Failed to kick: ${e.message}`);
    }
  }

  // ── /mute ─────────────────────────────────────────────────────
  if (text.startsWith('/mute')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to mute the user.');
    const target = msg.reply_to_message.from;
    if (await isAdmin(bot, chatId, target.id)) return bot.sendMessage(chatId, '❌ Cannot mute admins.');
    const duration = parseInt(text.split(' ')[1]) || 0;
    try {
      await applyPunishment(bot, chatId, target.id, 'mute', duration);
      return bot.sendMessage(chatId, `🔇 ${getUserMention(target)} was muted${duration ? ` for ${duration} minutes` : ' permanently'}.`, { parse_mode: 'Markdown' });
    } catch (e) {
      return bot.sendMessage(chatId, `❌ Failed to mute: ${e.message}`);
    }
  }

  // ── /unmute ───────────────────────────────────────────────────
  if (text.startsWith('/unmute')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to unmute the user.');
    const target = msg.reply_to_message.from;
    try {
      await bot.restrictChatMember(chatId, target.id, {
        permissions: {
          can_send_messages: true, can_send_audios: true,
          can_send_documents: true, can_send_photos: true,
          can_send_videos: true, can_send_voice_notes: true,
          can_send_other_messages: true, can_add_web_page_previews: true
        }
      });
      return bot.sendMessage(chatId, `✅ ${getUserMention(target)} was unmuted.`, { parse_mode: 'Markdown' });
    } catch (e) {
      return bot.sendMessage(chatId, `❌ Failed to unmute: ${e.message}`);
    }
  }

  // ── /addblacklist ─────────────────────────────────────────────
  if (text.startsWith('/addblacklist')) {
    const word = text.split(' ').slice(1).join(' ').trim();
    if (!word) return bot.sendMessage(chatId, '❌ Usage: /addblacklist <word>');
    const settings = await getGroupSettings(chatId);
    if (!settings.blocks.blacklist.words.includes(word)) {
      settings.blocks.blacklist.words.push(word);
      await settings.save();
    }
    return bot.sendMessage(chatId, `✅ Added "${word}" to the blacklist.`);
  }

  // ── /removeblacklist ──────────────────────────────────────────
  if (text.startsWith('/removeblacklist')) {
    const word = text.split(' ').slice(1).join(' ').trim();
    if (!word) return bot.sendMessage(chatId, '❌ Usage: /removeblacklist <word>');
    const settings = await getGroupSettings(chatId);
    settings.blocks.blacklist.words = settings.blocks.blacklist.words.filter(w => w !== word);
    await settings.save();
    return bot.sendMessage(chatId, `✅ Removed "${word}" from the blacklist.`);
  }

  // ── /pin ──────────────────────────────────────────────────────
  if (text.startsWith('/pin')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to pin it.');
    try {
      await bot.pinChatMessage(chatId, msg.reply_to_message.message_id);
      return bot.sendMessage(chatId, '📌 Message pinned.');
    } catch (e) {
      return bot.sendMessage(chatId, `❌ Failed to pin: ${e.message}`);
    }
  }

  // ── /unpin ────────────────────────────────────────────────────
  if (text.startsWith('/unpin')) {
    try {
      await bot.unpinChatMessage(chatId);
      return bot.sendMessage(chatId, '📌 Message unpinned.');
    } catch (e) {
      return bot.sendMessage(chatId, `❌ Failed to unpin: ${e.message}`);
    }
  }

  // ── /settings ─────────────────────────────────────────────────
  if (text.startsWith('/settings')) {
    const { handleSettingsCommand } = require('./settingsHandler');
    return handleSettingsCommand(bot, msg);
  }

  // Delete command messages if configured
  if (isAdminCommand) {
    const settings = await getGroupSettings(chatId).catch(() => null);
    if (settings?.deletingMessages?.commands) {
      bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    }
  }
}

module.exports = { handleCommands };
