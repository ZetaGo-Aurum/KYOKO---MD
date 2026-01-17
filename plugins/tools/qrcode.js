/**
 * QR Code Generator - KYOKO MD Feature
 * Generate QR code image
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'qrcode',
    alias: ['qr', 'qrgen', 'generateqr'],
    category: 'tools',
    description: 'Generate QR code dari text/URL',
    usage: '.qrcode <text/url>',
    example: '.qrcode https://example.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`❌ Format: .qrcode <text/url>\n\nContoh: .qrcode https://example.com`);
    }
    
    try {
        // Use QR code API
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
        
        await sock.sendMessage(m.chat, {
            image: { url: qrUrl },
            caption: `📱 *ǫʀ ᴄᴏᴅᴇ ɢᴇɴᴇʀᴀᴛᴇᴅ*\n\n📝 Data: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`
        }, { quoted: m.raw || m });
        
    } catch (error) {
        await m.reply(`❌ Gagal generate QR: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
