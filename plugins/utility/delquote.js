/**
 * Delete Quote - KYOKO MD Exclusive Feature
 * Remove saved quote by ID
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'delquote',
    alias: ['deletequote', 'hapusquote', 'rmquote'],
    category: 'utility',
    description: 'Hapus quote tersimpan berdasarkan ID',
    usage: '.delquote <id>',
    example: '.delquote lxyz123',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const quoteId = m.text?.trim();
    
    if (!quoteId) {
        return m.reply(`❌ Format: .delquote <id>\n\nGunakan \`.myquotes\` untuk melihat ID quote`);
    }
    
    const userData = db.getUser(m.sender) || {};
    const quotes = userData.savedQuotes || [];
    
    const quoteIndex = quotes.findIndex(q => q.id === quoteId);
    
    if (quoteIndex === -1) {
        return m.reply(`❌ Quote dengan ID "${quoteId}" tidak ditemukan.`);
    }
    
    const deletedQuote = quotes.splice(quoteIndex, 1)[0];
    db.setUser(m.sender, { savedQuotes: quotes });
    
    await m.reply(`✅ Quote berhasil dihapus!\n\n` +
        `📜 "${deletedQuote.text.substring(0, 50)}${deletedQuote.text.length > 50 ? '...' : ''}"\n\n` +
        `> Sisa quote: ${quotes.length}/50`);
}

module.exports = { config: pluginConfig, handler };
