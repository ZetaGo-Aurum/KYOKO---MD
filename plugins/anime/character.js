/**
 * Character Search - KYOKO MD Feature
 * Search anime/manga character
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'character',
    alias: ['chara', 'char', 'waifu'],
    category: 'anime',
    description: 'Cari karakter anime/manga',
    usage: '.character <nama>',
    example: '.character Hinata',
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
    const query = m.text?.trim();
    
    if (!query) {
        return m.reply(`❌ Format: .character <nama>\n\nContoh: .character Hinata Hyuga`);
    }
    
    await m.reply(`🔍 Mencari karakter "${query}"...`);
    
    try {
        const data = await fetchUrl(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`);
        const json = JSON.parse(data);
        
        if (!json.data || json.data.length === 0) {
            return m.reply(`❌ Karakter tidak ditemukan!`);
        }
        
        const char = json.data[0];
        
        let txt = `👤 *${char.name}*\n`;
        if (char.name_kanji) txt += `   ${char.name_kanji}\n`;
        txt += `\n`;
        
        txt += `📊 *ɪɴꜰᴏ*\n`;
        txt += `◦ Nicknames: ${char.nicknames?.join(', ') || '-'}\n`;
        txt += `◦ Favorites: ❤️ ${char.favorites?.toLocaleString() || 0}\n\n`;
        
        if (char.about) {
            txt += `📖 *ᴀʙᴏᴜᴛ*\n`;
            txt += `${char.about.substring(0, 600)}${char.about.length > 600 ? '...' : ''}\n\n`;
        }
        
        txt += `🔗 ${char.url}`;
        
        if (char.images?.jpg?.image_url) {
            await sock.sendMessage(m.chat, {
                image: { url: char.images.jpg.image_url },
                caption: txt
            }, { quoted: m.raw || m });
        } else {
            await m.reply(txt);
        }
        
    } catch (error) {
        await m.reply(`❌ Pencarian gagal: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
