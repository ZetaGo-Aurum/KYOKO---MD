/**
 * Quote Saver - KYOKO MD Exclusive Feature
 * Save memorable messages/quotes
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'savequote',
    alias: ['sq', 'simpanquote', 'quoteadd'],
    category: 'utility',
    description: 'Simpan quote/pesan memorable (reply ke pesan)',
    usage: '.savequote (reply ke pesan)',
    example: '.savequote',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    if (!m.quoted) {
        return m.reply(`❌ Reply ke pesan yang ingin disimpan sebagai quote!`);
    }
    
    const quoteText = m.quoted.body || m.quoted.text;
    if (!quoteText) {
        return m.reply(`❌ Pesan yang di-reply tidak berisi teks!`);
    }
    
    // Get user quotes
    const userData = db.getUser(m.sender) || {};
    const quotes = userData.savedQuotes || [];
    
    // Check limit (max 50 quotes per user)
    if (quotes.length >= 50) {
        return m.reply(`❌ Kamu sudah menyimpan 50 quote (maksimum). Hapus beberapa quote terlebih dahulu dengan \`.delquote <id>\``);
    }
    
    // Save quote
    const quoteId = Date.now().toString(36);
    quotes.push({
        id: quoteId,
        text: quoteText,
        author: m.quoted.sender?.replace(/@.+/g, '') || 'Unknown',
        savedAt: new Date().toISOString(),
        chat: m.isGroup ? m.groupName : 'Private'
    });
    
    db.setUser(m.sender, { savedQuotes: quotes });
    
    await m.reply(`✅ *ǫᴜᴏᴛᴇ ᴅɪꜱɪᴍᴘᴀɴ!*\n\n` +
        `📜 ID: \`${quoteId}\`\n` +
        `💬 "${quoteText.substring(0, 100)}${quoteText.length > 100 ? '...' : ''}"\n` +
        `👤 By: ${m.quoted.sender?.replace(/@.+/g, '') || 'Unknown'}\n\n` +
        `> Total quotes: ${quotes.length}/50`);
}

module.exports = { config: pluginConfig, handler };
