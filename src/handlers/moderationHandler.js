const { getGroupSettings, isAdmin, applyPunishment, formatMessage, hasArabic, hasCyrillic, hasChinese, hasLatin, hasTelegramLink, hasAnyLink } = require('../utils/helpers');
const { isFlooding } = require('../models/FloodTracker');
const UserWarning = require('../models/UserWarning');

async function handleGroupMessage(bot, msg) {
  if (!msg || !msg.chat || msg.chat.type === 'private') return;
  if (!msg.from) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text || msg.caption || '';

  // Skip admins
  if (await isAdmin(bot, chatId, userId)) return;

  const settings = await getGroupSettings(chatId);

  // ── ANTI-FLOOD ─────────────────────────────────────────────────
  if (settings.antiflood.enabled && settings.antiflood.punishment !== 'off') {
    const flooded = isFlooding(chatId, userId, settings.antiflood.messages, settings.antiflood.timeSeconds);
    if (flooded) {
      if (settings.antiflood.deleteMessages) {
        bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      }
      if (settings.antiflood.punishment === 'warn') {
        await addWarn(bot, chatId, userId, msg.from, settings, 'Antiflood');
      } else if (settings.antiflood.punishment !== 'deletion') {
        await applyPunishment(bot, chatId, userId, settings.antiflood.punishment);
        bot.sendMessage(chatId, `🌧 User was ${settings.antiflood.punishment}ed for flooding.`);
      }
      return;
    }
  }

  // ── ANTI-SPAM: Telegram links ─────────────────────────────────
  if (settings.antispam.telegramLinks && text && hasTelegramLink(text)) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    bot.sendMessage(chatId, '🚫 Telegram links are not allowed in this group.').then(m => {
      setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 5000);
    });
    return;
  }

  // ── ANTI-SPAM: Total links block ──────────────────────────────
  if (settings.antispam.totalLinksBlock && text && hasAnyLink(text)) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }

  // ── ANTI-SPAM: Forwarding ─────────────────────────────────────
  if (settings.antispam.forwarding && msg.forward_from) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }

  // ── ANTI-SPAM: Quotes ─────────────────────────────────────────
  if (settings.antispam.quotes && msg.reply_to_message?.forward_from) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }

  // ── ALPHABETS ─────────────────────────────────────────────────
  if (text) {
    const alphaChecks = [
      { key: 'arabic', check: hasArabic },
      { key: 'cyrillic', check: hasCyrillic },
      { key: 'chinese', check: hasChinese },
      { key: 'latin', check: hasLatin }
    ];

    for (const { key, check } of alphaChecks) {
      const alpha = settings.alphabets[key];
      if (alpha?.enabled && check(text)) {
        const punishment = alpha.punishment;
        if (punishment === 'deletion') {
          bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        } else if (punishment === 'warn') {
          await addWarn(bot, chatId, userId, msg.from, settings, `${key} alphabet`);
          bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        } else {
          await applyPunishment(bot, chatId, userId, punishment);
          bot.sendMessage(chatId, `🚫 User was ${punishment}ed for using ${key} alphabet.`);
        }
        return;
      }
    }
  }

  // ── MEDIA BLOCK ───────────────────────────────────────────────
  const mediaTypeMap = [
    { key: 'photo', check: () => msg.photo },
    { key: 'video', check: () => msg.video },
    { key: 'audio', check: () => msg.audio },
    { key: 'voice', check: () => msg.voice },
    { key: 'sticker', check: () => msg.sticker && !msg.sticker.is_animated },
    { key: 'animatedStickers', check: () => msg.sticker?.is_animated },
    { key: 'gif', check: () => msg.animation },
    { key: 'file', check: () => msg.document },
    { key: 'video', check: () => msg.video_note }
  ];

  for (const { key, check } of mediaTypeMap) {
    const punishment = settings.media[key];
    if (punishment && punishment !== 'off' && check()) {
      if (punishment === 'deletion') {
        bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      } else if (punishment === 'warn') {
        await addWarn(bot, chatId, userId, msg.from, settings, `media (${key})`);
        bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      } else {
        await applyPunishment(bot, chatId, userId, punishment);
        bot.sendMessage(chatId, `🚫 Media blocked in this group.`);
      }
      return;
    }
  }

  // ── NIGHT MODE ────────────────────────────────────────────────
  if (settings.nightMode.enabled) {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 7) {
      if (settings.nightMode.globalSilence) {
        bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        return;
      }
      if (settings.nightMode.deleteMedias && (msg.photo || msg.video || msg.sticker || msg.animation)) {
        bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        return;
      }
    }
  }

  // ── BLACKLIST ─────────────────────────────────────────────────
  if (text && settings.blocks.blacklist?.words?.length > 0) {
    const lower = text.toLowerCase();
    const found = settings.blocks.blacklist.words.some(word => lower.includes(word.toLowerCase()));
    if (found) {
      bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      return;
    }
  }

  // ── DELETING MESSAGES: Global Silence ────────────────────────
  if (settings.deletingMessages.globalSilence) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }
}

async function handleNewMember(bot, msg) {
  if (!msg.new_chat_members) return;
  const chatId = msg.chat.id;
  const settings = await getGroupSettings(chatId);

  for (const newMember of msg.new_chat_members) {
    // Skip bot itself
    if (newMember.is_bot && newMember.id === (await bot.getMe()).id) {
      settings.chatTitle = msg.chat.title || '';
      await settings.save();
      continue;
    }

    // Bot block
    if (settings.blocks.botBlock && newMember.is_bot) {
      bot.banChatMember(chatId, newMember.id).catch(() => {});
      continue;
    }

    // Join block
    if (settings.blocks.joinBlock) {
      bot.banChatMember(chatId, newMember.id).catch(() => {}).then(() => bot.unbanChatMember(chatId, newMember.id).catch(() => {}));
      continue;
    }

    // Captcha
    if (settings.captcha.enabled) {
      const captchaTracker = require('../models/CaptchaTracker');
      // Restrict user
      try {
        await bot.restrictChatMember(chatId, newMember.id, {
          permissions: {
            can_send_messages: false, can_send_audios: false,
            can_send_documents: false, can_send_photos: false,
            can_send_videos: false, can_send_voice_notes: false,
            can_send_other_messages: false
          }
        });
      } catch {}

      const captchaMsg = await bot.sendMessage(chatId,
        `🧠 *Captcha Verification*\n\n${newMember.first_name}, please verify you are human by clicking the button below.\n\nYou have *${settings.captcha.timeoutSeconds} seconds*.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '✅ I am not a robot', callback_data: `captcha_verify:${newMember.id}` }]]
          }
        }
      );

      captchaTracker.setPending(chatId, newMember.id, captchaMsg.message_id, settings.captcha.timeoutSeconds);

      // Set timeout for failure
      setTimeout(async () => {
        if (captchaTracker.isPending(chatId, newMember.id)) {
          captchaTracker.resolveCaptcha(chatId, newMember.id);
          bot.deleteMessage(chatId, captchaMsg.message_id).catch(() => {});
          if (settings.captcha.punishment && settings.captcha.punishment !== 'off') {
            await applyPunishment(bot, chatId, newMember.id, settings.captcha.punishment);
            bot.sendMessage(chatId, `⏱ ${newMember.first_name} failed the captcha and was ${settings.captcha.punishment}ed.`);
          }
        }
      }, settings.captcha.timeoutSeconds * 1000);
      continue;
    }

    // Welcome message
    if (settings.welcome.enabled) {
      const welcomeText = formatMessage(settings.welcome.message, newMember, msg.chat);
      const sentMsg = await bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
      if (settings.welcome.deleteLastMessage) {
        bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      }
    }
  }
}

async function handleLeftMember(bot, msg) {
  if (!msg.left_chat_member) return;
  const chatId = msg.chat.id;
  const settings = await getGroupSettings(chatId);
  const leftMember = msg.left_chat_member;

  if (settings.goodbye.enabled) {
    const goodbyeText = formatMessage(settings.goodbye.message, leftMember, msg.chat);
    bot.sendMessage(chatId, goodbyeText, { parse_mode: 'Markdown' });
    if (settings.goodbye.deleteLastMessage) {
      bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    }
  }
}

async function addWarn(bot, chatId, userId, userObj, settings, reason = '') {
  const UserWarning = require('../models/UserWarning');
  let userWarn = await UserWarning.findOne({ chatId: String(chatId), userId: String(userId) });
  if (!userWarn) {
    userWarn = new UserWarning({
      chatId: String(chatId),
      userId: String(userId),
      username: userObj.username || '',
      firstName: userObj.first_name || ''
    });
  }
  userWarn.warns++;
  if (reason) userWarn.warnReasons.push({ reason });
  await userWarn.save();

  const maxWarns = settings.warns.maxWarns || 3;
  if (userWarn.warns >= maxWarns) {
    // Apply punishment
    await applyPunishment(bot, chatId, userId, settings.warns.punishment, settings.warns.muteDuration);
    userWarn.warns = 0;
    userWarn.warnReasons = [];
    await userWarn.save();
    bot.sendMessage(chatId, `❗ [${userObj.first_name}](tg://user?id=${userId}) has reached ${maxWarns} warnings and was *${settings.warns.punishment}ed*.`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, `⚠️ [${userObj.first_name}](tg://user?id=${userId}) warned (${userWarn.warns}/${maxWarns})${reason ? ` - ${reason}` : ''}.`, { parse_mode: 'Markdown' });
  }
}

module.exports = { handleGroupMessage, handleNewMember, handleLeftMember, addWarn };
