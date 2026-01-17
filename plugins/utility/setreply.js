/**
 * Smart Auto-Reply System - KYOKO MD Exclusive Feature
 * Custom auto-responses with triggers
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'setreply',
    alias: ['addreply', 'autoreply'],
    category: 'utility',
    description: 'Set auto-reply custom untuk keyword tertentu',
    usage: '.setreply <trigger>|<response>',
    example: '.setreply halo|Halo juga! Selamat datang 👋',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    if (!m.isAdmin && !m.isOwner) {
        return m.reply('❌ Hanya admin grup yang bisa mengatur auto-reply!');
    }
    
    const text = m.text?.trim();
    if (!text || !text.includes('|')) {
        return m.reply(`❌ Format: .setreply <trigger>|<response>\n\nContoh: .setreply halo|Halo juga! Selamat datang 👋\n\n> Gunakan | sebagai pemisah trigger dan response`);
    }
    
    const [trigger, ...responseParts] = text.split('|');
    const response = responseParts.join('|').trim();
    const triggerLower = trigger.trim().toLowerCase();
    
    if (!triggerLower || !response) {
        return m.reply(`❌ Format: .setreply <trigger>|<response>`);
    }
    
    // Get group auto-replies
    const groupData = db.getGroup(m.chat) || {};
    const autoReplies = groupData.autoReplies || {};
    
    // Save auto-reply
    autoReplies[triggerLower] = {
        response,
        createdBy: m.sender,
        createdAt: new Date().toISOString()
    };
    
    db.setGroup(m.chat, { autoReplies });
    
    await m.reply(`✅ *ᴀᴜᴛᴏ-ʀᴇᴘʟʏ ᴅɪꜱɪᴍᴘᴀɴ!*\n\n` +
        `🎯 Trigger: \`${triggerLower}\`\n` +
        `💬 Response: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}\n\n` +
        `> Auto-reply akan aktif saat ada yang mengetik "${triggerLower}"`);
}

module.exports = { config: pluginConfig, handler };
