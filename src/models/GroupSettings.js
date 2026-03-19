const mongoose = require('mongoose');

const groupSettingsSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  chatTitle: { type: String, default: '' },

  // Regulation
  regulation: {
    message: { type: String, default: 'No rules set yet.' },
    commandPermissions: { type: String, default: 'all' }
  },

  // Welcome
  welcome: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: 'Welcome {user} to {group}!' },
    deleteLastMessage: { type: Boolean, default: false }
  },

  // Goodbye
  goodbye: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: 'Goodbye {user}!' },
    sendPrivate: { type: Boolean, default: false },
    deleteLastMessage: { type: Boolean, default: false }
  },

  // Anti-Spam
  antispam: {
    telegramLinks: { type: Boolean, default: false },
    forwarding: { type: Boolean, default: false },
    quotes: { type: Boolean, default: false },
    totalLinksBlock: { type: Boolean, default: false }
  },

  // Anti-Flood
  antiflood: {
    enabled: { type: Boolean, default: false },
    messages: { type: Number, default: 5 },
    timeSeconds: { type: Number, default: 3 },
    punishment: { type: String, default: 'deletion', enum: ['off','deletion','warn','kick','mute','ban'] },
    deleteMessages: { type: Boolean, default: true }
  },

  // Alphabets
  alphabets: {
    arabic: { enabled: { type: Boolean, default: false }, punishment: { type: String, default: 'deletion' } },
    cyrillic: { enabled: { type: Boolean, default: false }, punishment: { type: String, default: 'deletion' } },
    chinese: { enabled: { type: Boolean, default: false }, punishment: { type: String, default: 'deletion' } },
    latin: { enabled: { type: Boolean, default: false }, punishment: { type: String, default: 'deletion' } }
  },

  // Captcha
  captcha: {
    enabled: { type: Boolean, default: false },
    punishment: { type: String, default: 'kick' },
    timeoutSeconds: { type: Number, default: 60 },
    deleteServiceMessage: { type: Boolean, default: false }
  },

  // Checks (Obligations & Name Blocks)
  checks: {
    obligations: {
      surname: { type: Boolean, default: false },
      username: { type: Boolean, default: false },
      profilePicture: { type: Boolean, default: false },
      channelObligation: { type: Boolean, default: false },
      obligationToAdd: { type: Boolean, default: false }
    },
    nameBlocks: {
      arabic: { type: Boolean, default: false },
      chinese: { type: Boolean, default: false },
      russian: { type: Boolean, default: false },
      spam: { type: Boolean, default: false }
    },
    checkAtJoin: { type: Boolean, default: true },
    deleteMessages: { type: Boolean, default: false }
  },

  // Admin report
  adminReport: {
    enabled: { type: Boolean, default: true },
    sendTo: { type: String, default: 'founder' },
    tagFounder: { type: Boolean, default: false },
    tagAdmins: { type: Boolean, default: false }
  },

  // Blocks
  blocks: {
    blacklist: { words: [String], punishment: { type: String, default: 'deletion' } },
    botBlock: { type: Boolean, default: false },
    joinBlock: { type: Boolean, default: false },
    leaveBlock: { type: Boolean, default: false },
    joinLeaveBlock: { type: Boolean, default: false },
    multipleJoinsBlock: { type: Boolean, default: false }
  },

  // Media Block
  media: {
    story: { type: String, default: 'off' },
    photo: { type: String, default: 'off' },
    video: { type: String, default: 'off' },
    album: { type: String, default: 'off' },
    gif: { type: String, default: 'off' },
    voice: { type: String, default: 'off' },
    audio: { type: String, default: 'off' },
    sticker: { type: String, default: 'off' },
    animatedStickers: { type: String, default: 'off' },
    animatedGames: { type: String, default: 'off' },
    animatedEmoji: { type: String, default: 'off' },
    premiumEmoji: { type: String, default: 'off' },
    file: { type: String, default: 'off' }
  },

  // Warns
  warns: {
    maxWarns: { type: Number, default: 3 },
    punishment: { type: String, default: 'mute' },
    muteDuration: { type: Number, default: 0 }
  },

  // Night Mode
  nightMode: {
    enabled: { type: Boolean, default: false },
    deleteMedias: { type: Boolean, default: false },
    globalSilence: { type: Boolean, default: false }
  },

  // Porn
  porn: { enabled: { type: Boolean, default: false } },

  // Tag
  tag: { enabled: { type: Boolean, default: false }, message: { type: String, default: '' } },

  // Link
  link: { enabled: { type: Boolean, default: false } },

  // Approval Mode
  approvalMode: {
    autoApproval: { type: Boolean, default: false }
  },

  // Deleting Messages
  deletingMessages: {
    commands: { type: Boolean, default: false },
    globalSilence: { type: Boolean, default: false },
    editChecks: { type: Boolean, default: false },
    serviceMessages: { type: Boolean, default: false },
    scheduledDeletion: { type: Boolean, default: false },
    blockCancellation: { type: Boolean, default: false }
  },

  // Language
  language: { type: String, default: 'en' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

groupSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('GroupSettings', groupSettingsSchema);
