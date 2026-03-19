const GroupSettings = require('../models/GroupSettings');

// Get or create group settings
async function getGroupSettings(chatId) {
  let settings = await GroupSettings.findOne({ chatId: String(chatId) });
  if (!settings) {
    settings = new GroupSettings({ chatId: String(chatId) });
    await settings.save();
  }
  return settings;
}

// Check if user is admin
async function isAdmin(bot, chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return ['creator', 'administrator'].includes(member.status);
  } catch {
    return false;
  }
}

// Check if user is creator/founder
async function isCreator(bot, chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return member.status === 'creator';
  } catch {
    return false;
  }
}

// Get user mention
function getUserMention(user) {
  const name = user.first_name + (user.last_name ? ' ' + user.last_name : '');
  return `[${name}](tg://user?id=${user.id})`;
}

// Apply punishment
async function applyPunishment(bot, chatId, userId, punishment, muteDuration = 0) {
  try {
    switch (punishment) {
      case 'ban':
        await bot.banChatMember(chatId, userId);
        break;
      case 'kick':
        await bot.banChatMember(chatId, userId);
        await bot.unbanChatMember(chatId, userId);
        break;
      case 'mute':
        const until = muteDuration > 0 ? Math.floor(Date.now() / 1000) + muteDuration * 60 : 0;
        await bot.restrictChatMember(chatId, userId, {
          permissions: {
            can_send_messages: false,
            can_send_audios: false,
            can_send_documents: false,
            can_send_photos: false,
            can_send_videos: false,
            can_send_video_notes: false,
            can_send_voice_notes: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false
          },
          until_date: until
        });
        break;
      default:
        break;
    }
  } catch (e) {
    console.error(`Punishment error (${punishment}):`, e.message);
  }
}

// Format settings message for display
function formatOnOff(val) {
  return val ? '✅ On' : '❌ Off';
}

// Replace template variables in messages
function formatMessage(template, user, chat) {
  const name = user.first_name + (user.last_name ? ' ' + user.last_name : '');
  return template
    .replace(/{user}/g, `[${name}](tg://user?id=${user.id})`)
    .replace(/{username}/g, user.username ? `@${user.username}` : name)
    .replace(/{group}/g, chat.title || 'Group')
    .replace(/{id}/g, user.id);
}

// Check if text contains Arabic characters
function hasArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

// Check if text contains Cyrillic characters
function hasCyrillic(text) {
  return /[\u0400-\u04FF]/.test(text);
}

// Check if text contains Chinese characters
function hasChinese(text) {
  return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text);
}

// Check if text contains Latin characters only (no other scripts)
function hasLatin(text) {
  return /[a-zA-Z]/.test(text) && !/[\u0600-\u06FF\u0400-\u04FF\u4E00-\u9FFF\u0900-\u097F]/.test(text);
}

// Check for Telegram links
function hasTelegramLink(text) {
  return /(?:https?:\/\/)?(?:t\.me|telegram\.me|telegram\.dog)\/\S+/i.test(text);
}

// Check for any URL
function hasAnyLink(text) {
  return /https?:\/\/\S+|www\.\S+/i.test(text);
}

module.exports = {
  getGroupSettings,
  isAdmin,
  isCreator,
  getUserMention,
  applyPunishment,
  formatOnOff,
  formatMessage,
  hasArabic,
  hasCyrillic,
  hasChinese,
  hasLatin,
  hasTelegramLink,
  hasAnyLink
};
