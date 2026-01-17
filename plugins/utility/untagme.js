/**
 * Untag Me - KYOKO MD Exclusive Feature
 * Remove keyword notification
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'untagme',
    alias: ['removetagme', 'deltagme'],
    category: 'utility',
    description: 'Hapus keyword dari notifikasi',
    usage: '.untagme <keyword>',
    example: '.untagme meeting',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const keyword = m.text?.trim()?.toLowerCase();
    
    if (!keyword) {
        return m.reply(`❌ Format: .untagme <keyword>`);
    }
    
    const userData = db.getUser(m.sender) || {};
    const tagwords = userData.tagwords || {};
    
    if (!tagwords[m.chat] || !tagwords[m.chat].includes(keyword)) {
        return m.reply(`❌ Keyword "${keyword}" tidak ada di daftar tagword kamu.`);
    }
    
    tagwords[m.chat] = tagwords[m.chat].filter(k => k !== keyword);
    db.setUser(m.sender, { tagwords });
    
    await m.reply(`✅ Keyword *${keyword}* berhasil dihapus dari tagword!`);
}

module.exports = { config: pluginConfig, handler };
