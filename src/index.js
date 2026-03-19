require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const connectDB = require('./utils/database');
const { startServer } = require('./utils/server');
const { handleSettingsCommand, handleCallback } = require('./handlers/settingsHandler');
const { handleGroupMessage, handleNewMember, handleLeftMember } = require('./handlers/moderationHandler');
const { handleCommands } = require('./handlers/commandHandler');
const { resolveCaptcha } = require('./models/CaptchaTracker');
const { getGroupSettings, isAdmin, formatMessage, applyPunishment } = require('./utils/helpers');

// Validate required env vars
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required in .env file');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is required in .env file');
  process.exit(1);
}

async function main() {
  // Connect to MongoDB
  await connectDB();

  // Initialize bot
  const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

  // Start web server for Render/UptimeRobot
  startServer();

  // Bot info
  const me = await bot.getMe();
  console.log(`🤖 Bot started: @${me.username} (${me.first_name})`);
  console.log(`🆔 Bot ID: ${me.id}`);

  // ── MESSAGE HANDLER ───────────────────────────────────────────
  bot.on('message', async (msg) => {
    try {
      // New members joined
      if (msg.new_chat_members) {
        await handleNewMember(bot, msg);
        return;
      }

      // Member left
      if (msg.left_chat_member) {
        await handleLeftMember(bot, msg);
        return;
      }

      // Commands
      if (msg.text && msg.text.startsWith('/')) {
        await handleCommands(bot, msg);
        return;
      }

      // @admin mention
      if (msg.text && (msg.text.includes('@admin') || msg.text.includes('@admins'))) {
        await handleCommands(bot, msg);
        return;
      }

      // Group message moderation
      if (msg.chat.type !== 'private') {
        await handleGroupMessage(bot, msg);
      }
    } catch (error) {
      console.error('Message handler error:', error.message);
    }
  });

  // ── CALLBACK QUERY HANDLER ────────────────────────────────────
  bot.on('callback_query', async (query) => {
    try {
      const data = query.data;

      // Captcha verification
      if (data.startsWith('captcha_verify:')) {
        const targetUserId = parseInt(data.split(':')[1]);
        const callerId = query.from.id;
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;

        if (callerId !== targetUserId) {
          return bot.answerCallbackQuery(query.id, { text: '❌ This captcha is not for you!', show_alert: true });
        }

        const captchaData = resolveCaptcha(chatId, targetUserId);
        if (!captchaData) {
          return bot.answerCallbackQuery(query.id, { text: '⏱ Captcha expired!', show_alert: true });
        }

        // Restore user permissions
        try {
          await bot.restrictChatMember(chatId, targetUserId, {
            permissions: {
              can_send_messages: true, can_send_audios: true,
              can_send_documents: true, can_send_photos: true,
              can_send_videos: true, can_send_voice_notes: true,
              can_send_other_messages: true, can_add_web_page_previews: true,
              can_send_polls: true
            }
          });
        } catch {}

        await bot.deleteMessage(chatId, messageId).catch(() => {});
        await bot.answerCallbackQuery(query.id, { text: '✅ Verification successful!' });

        // Send welcome message now
        const settings = await getGroupSettings(chatId);
        if (settings.welcome.enabled) {
          const welcomeText = formatMessage(settings.welcome.message, query.from, query.message.chat);
          bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
        }
        return;
      }

      // Private start callbacks
      if (data === 'private:info') {
        return bot.answerCallbackQuery(query.id, {
          text: 'SenpaiHelpBot - Advanced Telegram Group Management Bot',
          show_alert: true
        });
      }

      if (data === 'private:lang') {
        return bot.answerCallbackQuery(query.id, { text: 'Currently only English is supported.', show_alert: true });
      }

      if (data === 'private:settings') {
        return bot.answerCallbackQuery(query.id, {
          text: 'Add me to a group and use /settings there!',
          show_alert: true
        });
      }

      // Settings callbacks
      await handleCallback(bot, query);

    } catch (error) {
      console.error('Callback handler error:', error.message);
      try {
        await bot.answerCallbackQuery(query.id, { text: '❌ An error occurred.' });
      } catch {}
    }
  });

  // ── ERROR HANDLERS ────────────────────────────────────────────
  bot.on('polling_error', (error) => {
    console.error('Polling error:', error.message);
  });

  bot.on('error', (error) => {
    console.error('Bot error:', error.message);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Bot stopping...');
    bot.stopPolling();
    process.exit(0);
  });

  console.log('✅ SenpaiHelpBot is running and ready!');
  console.log('📋 Commands: /start, /help, /settings, /rules, /warn, /ban, /kick, /mute and more');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
