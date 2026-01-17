/**
 * My Quotes - KYOKO MD Exclusive Feature
 * View all saved quotes
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'myquotes',
    alias: ['quotelist', 'quotes', 'listquote'],
    category: 'utility',
    description: 'Lihat semua quote yang tersimpan',
    usage: '.myquotes',
    example: '.myquotes',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const userData = db.getUser(m.sender) || {};
    const quotes = userData.savedQuotes || [];
    
    if (quotes.length === 0) {
        return m.reply(`📜 *ᴋᴏʟᴇᴋꜱɪ ǫᴜᴏᴛᴇ*\n\n> Kamu belum punya quote tersimpan.\n> Reply ke pesan dan ketik \`.savequote\` untuk menyimpan quote.`);
    }
    
    let txt = `📜 *ᴋᴏʟᴇᴋꜱɪ ǫᴜᴏᴛᴇ* (${quotes.length}/50)\n\n`;
    
    const displayQuotes = quotes.slice(-15); // Show last 15
    displayQuotes.forEach((quote, i) => {
        const preview = quote.text.substring(0, 35) + (quote.text.length > 35 ? '...' : '');
        txt += `${i + 1}. \`${quote.id}\` "${preview}"\n`;
    });
    
    if (quotes.length > 15) {
        txt += `\n> ... dan ${quotes.length - 15} quote lainnya`;
    }
    
    txt += `\n\n> \`.randomquote\` - Quote random`;
    txt += `\n> \`.delquote <id>\` - Hapus quote`;
    
    await m.reply(txt);
}

module.exports = { config: pluginConfig, handler };
