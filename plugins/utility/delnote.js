/**
 * Delete Note - KYOKO MD Exclusive Feature
 * Delete saved notes
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'delnote',
    alias: ['deletenote', 'hapusnote', 'removenote'],
    category: 'utility',
    description: 'Hapus catatan berdasarkan keyword',
    usage: '.delnote <keyword>',
    example: '.delnote jadwal',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const keyword = m.text?.trim()?.toLowerCase();
    
    if (!keyword) {
        return m.reply(`❌ Format: .delnote <keyword>`);
    }
    
    const userData = db.getUser(m.sender) || {};
    const notes = userData.notes || {};
    
    if (!notes[keyword]) {
        return m.reply(`❌ Note dengan keyword "${keyword}" tidak ditemukan.`);
    }
    
    delete notes[keyword];
    db.setUser(m.sender, { notes });
    
    await m.reply(`✅ Note *${keyword}* berhasil dihapus!`);
}

module.exports = { config: pluginConfig, handler };
