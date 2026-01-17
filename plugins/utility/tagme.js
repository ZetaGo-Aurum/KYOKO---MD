/**
 * Tag Me - KYOKO MD Exclusive Feature
 * Get notified when keyword is mentioned in group
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'tagme',
    alias: ['alertme', 'notifyme', 'watchword'],
    category: 'utility',
    description: 'Dapat notifikasi saat keyword disebut di grup',
    usage: '.tagme <keyword>',
    example: '.tagme meeting',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const keyword = m.text?.trim()?.toLowerCase();
    
    if (!keyword) {
        return m.reply(`❌ Format: .tagme <keyword>\n\nContoh: .tagme meeting\n\n> Kamu akan di-mention saat ada yang menyebut kata tersebut di grup`);
    }
    
    if (keyword.length < 3) {
        return m.reply(`❌ Keyword minimal 3 karakter!`);
    }
    
    // Get user tagwords
    const userData = db.getUser(m.sender) || {};
    const tagwords = userData.tagwords || {};
    
    // Add tagword for this group
    if (!tagwords[m.chat]) {
        tagwords[m.chat] = [];
    }
    
    // Check if already exists
    if (tagwords[m.chat].includes(keyword)) {
        return m.reply(`⚠️ Keyword "${keyword}" sudah ada di daftar tagword kamu untuk grup ini.`);
    }
    
    // Limit 10 keywords per group
    if (tagwords[m.chat].length >= 10) {
        return m.reply(`❌ Maksimal 10 keyword per grup! Hapus beberapa dengan \`.untagme <keyword>\``);
    }
    
    tagwords[m.chat].push(keyword);
    db.setUser(m.sender, { tagwords });
    
    await m.reply(`✅ *ᴛᴀɢᴡᴏʀᴅ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ!*\n\n` +
        `🏷️ Keyword: \`${keyword}\`\n` +
        `👥 Grup: ${m.groupName || 'This Group'}\n\n` +
        `> Kamu akan di-mention saat ada yang menyebut "${keyword}"`);
}

module.exports = { config: pluginConfig, handler };
