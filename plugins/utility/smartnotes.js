/**
 * Smart Notes System - KYOKO MD Exclusive Feature
 * Personal notes with custom keyword triggers
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'setnote',
    alias: ['addnote', 'simpannote'],
    category: 'utility',
    description: 'Simpan catatan dengan keyword trigger',
    usage: '.setnote <keyword> <isi catatan>',
    example: '.setnote jadwal Jadwal meeting setiap Senin jam 9 pagi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const text = m.text?.trim();
    if (!text) {
        return m.reply(`❌ Format: .setnote <keyword> <isi catatan>\n\nContoh: .setnote jadwal Jadwal meeting setiap Senin jam 9 pagi`);
    }
    
    const parts = text.split(' ');
    const keyword = parts[0]?.toLowerCase();
    const content = parts.slice(1).join(' ');
    
    if (!keyword || !content) {
        return m.reply(`❌ Format: .setnote <keyword> <isi catatan>`);
    }
    
    // Get user notes
    const userData = db.getUser(m.sender) || {};
    const notes = userData.notes || {};
    
    // Save note
    notes[keyword] = {
        content,
        createdAt: new Date().toISOString(),
        usageCount: 0
    };
    
    db.setUser(m.sender, { notes });
    
    await m.reply(`✅ *ɴᴏᴛᴇ ᴅɪsɪᴍᴘᴀɴ!*\n\n` +
        `📝 Keyword: \`${keyword}\`\n` +
        `📄 Isi: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n\n` +
        `> Gunakan \`.getnote ${keyword}\` untuk melihat note`);
}

module.exports = { config: pluginConfig, handler };
