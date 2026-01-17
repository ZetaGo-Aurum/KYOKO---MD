/**
 * Random Quote - KYOKO MD Exclusive Feature
 * Get random saved quote
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'randomquote',
    alias: ['rq', 'randquote', 'quoterandom'],
    category: 'utility',
    description: 'Ambil quote random dari koleksi tersimpan',
    usage: '.randomquote',
    example: '.randomquote',
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
        return m.reply(`📜 *ʀᴀɴᴅᴏᴍ ǫᴜᴏᴛᴇ*\n\n> Kamu belum punya quote tersimpan.\n> Reply ke pesan dan ketik \`.savequote\` untuk menyimpan quote.`);
    }
    
    // Get random quote
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    
    const savedDate = new Date(quote.savedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    await m.reply(`📜 *ʀᴀɴᴅᴏᴍ ǫᴜᴏᴛᴇ*\n\n` +
        `"${quote.text}"\n\n` +
        `— *${quote.author}*\n` +
        `📍 ${quote.chat} • ${savedDate}\n\n` +
        `> ID: \`${quote.id}\` • Quote ${randomIndex + 1}/${quotes.length}`);
}

module.exports = { config: pluginConfig, handler };
