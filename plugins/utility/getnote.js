/**
 * Get Note - KYOKO MD Exclusive Feature
 * Retrieve saved notes by keyword
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'getnote',
    alias: ['note', 'n'],
    category: 'utility',
    description: 'Ambil catatan berdasarkan keyword',
    usage: '.getnote <keyword>',
    example: '.getnote jadwal',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const keyword = m.text?.trim()?.toLowerCase();
    
    if (!keyword) {
        return m.reply(`❌ Format: .getnote <keyword>\n\nGunakan \`.listnotes\` untuk melihat semua note`);
    }
    
    const userData = db.getUser(m.sender) || {};
    const notes = userData.notes || {};
    
    if (!notes[keyword]) {
        return m.reply(`❌ Note dengan keyword "${keyword}" tidak ditemukan.\n\nGunakan \`.listnotes\` untuk melihat semua note`);
    }
    
    // Increment usage count
    notes[keyword].usageCount = (notes[keyword].usageCount || 0) + 1;
    notes[keyword].lastUsed = new Date().toISOString();
    db.setUser(m.sender, { notes });
    
    await m.reply(`📝 *ɴᴏᴛᴇ: ${keyword}*\n\n${notes[keyword].content}`);
}

module.exports = { config: pluginConfig, handler };
