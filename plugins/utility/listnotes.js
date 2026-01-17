/**
 * List Notes - KYOKO MD Exclusive Feature
 * View all saved notes
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'listnotes',
    alias: ['notes', 'mynotes', 'allnotes'],
    category: 'utility',
    description: 'Lihat semua catatan yang tersimpan',
    usage: '.listnotes',
    example: '.listnotes',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const userData = db.getUser(m.sender) || {};
    const notes = userData.notes || {};
    const keywords = Object.keys(notes);
    
    if (keywords.length === 0) {
        return m.reply(`📝 *ᴅᴀꜰᴛᴀʀ ɴᴏᴛᴇ*\n\n> Kamu belum punya note tersimpan.\n> Gunakan \`.setnote <keyword> <isi>\` untuk membuat note.`);
    }
    
    let txt = `📝 *ᴅᴀꜰᴛᴀʀ ɴᴏᴛᴇ* (${keywords.length})\n\n`;
    
    keywords.forEach((key, i) => {
        const note = notes[key];
        const preview = note.content.substring(0, 30) + (note.content.length > 30 ? '...' : '');
        txt += `${i + 1}. \`${key}\` - ${preview}\n`;
    });
    
    txt += `\n> Gunakan \`.getnote <keyword>\` untuk melihat note`;
    txt += `\n> Gunakan \`.delnote <keyword>\` untuk menghapus note`;
    
    await m.reply(txt);
}

module.exports = { config: pluginConfig, handler };
