/**
 * Neko - KYOKO MD Feature
 * Get random neko image
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'neko',
    alias: ['catgirl', 'nekomimi'],
    category: 'anime',
    description: 'Random gambar neko',
    usage: '.neko',
    example: '.neko',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'KYOKO-MD/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function handler(m, { sock }) {
    try {
        const data = await fetchUrl(`https://api.waifu.pics/sfw/neko`);
        const json = JSON.parse(data);
        
        if (!json.url) {
            return m.reply(`❌ Gagal mengambil gambar!`);
        }
        
        await sock.sendMessage(m.chat, {
            image: { url: json.url },
            caption: `🐱 *ʀᴀɴᴅᴏᴍ ɴᴇᴋᴏ*\n\n> Nyaa~`
        }, { quoted: m.raw || m });
        
    } catch (error) {
        await m.reply(`❌ Gagal: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
