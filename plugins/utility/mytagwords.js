/**
 * My Tag Words - KYOKO MD Exclusive Feature
 * View all tag words
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'mytagwords',
    alias: ['tagwords', 'listtagme'],
    category: 'utility',
    description: 'Lihat semua keyword tagword di grup ini',
    usage: '.mytagwords',
    example: '.mytagwords',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const userData = db.getUser(m.sender) || {};
    const tagwords = userData.tagwords || {};
    const groupTagwords = tagwords[m.chat] || [];
    
    if (groupTagwords.length === 0) {
        return m.reply(`🏷️ *ᴛᴀɢᴡᴏʀᴅs*\n\n> Kamu belum punya tagword di grup ini.\n> Gunakan \`.tagme <keyword>\` untuk menambahkan.`);
    }
    
    let txt = `🏷️ *ᴛᴀɢᴡᴏʀᴅs* (${groupTagwords.length}/10)\n\n`;
    
    groupTagwords.forEach((kw, i) => {
        txt += `${i + 1}. \`${kw}\`\n`;
    });
    
    txt += `\n> Kamu akan di-mention saat ada yang menyebut keyword di atas`;
    txt += `\n> Gunakan \`.untagme <keyword>\` untuk menghapus`;
    
    await m.reply(txt);
}

module.exports = { config: pluginConfig, handler };
