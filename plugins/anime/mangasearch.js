/**
 * Manga Search - KYOKO MD Feature
 * Search manga information
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'manga',
    alias: ['searchmanga', 'komik'],
    category: 'anime',
    description: 'Cari informasi manga',
    usage: '.manga <judul>',
    example: '.manga One Piece',
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
        return m.reply(`❌ Format: .manga <judul>\n\nContoh: .manga One Piece`);
    }
    
    await m.reply(`🔍 Mencari manga "${query}"...`);
    
    try {
        const data = await fetchUrl(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=1`);
        const json = JSON.parse(data);
        
        if (!json.data || json.data.length === 0) {
            return m.reply(`❌ Manga tidak ditemukan!`);
        }
        
        const manga = json.data[0];
        
        let txt = `📚 *${manga.title}*\n`;
        if (manga.title_japanese) txt += `   ${manga.title_japanese}\n`;
        txt += `\n`;
        
        txt += `📊 *ɪɴꜰᴏ*\n`;
        txt += `◦ Type: ${manga.type || '-'}\n`;
        txt += `◦ Chapters: ${manga.chapters || '?'}\n`;
        txt += `◦ Volumes: ${manga.volumes || '?'}\n`;
        txt += `◦ Status: ${manga.status || '-'}\n`;
        txt += `◦ Score: ⭐ ${manga.score || '-'}/10\n`;
        txt += `◦ Rank: #${manga.rank || '-'}\n`;
        txt += `◦ Authors: ${manga.authors?.map(a => a.name).join(', ') || '-'}\n\n`;
        
        txt += `📝 *ɢᴇɴʀᴇꜱ*\n`;
        txt += `${manga.genres?.map(g => g.name).join(', ') || '-'}\n\n`;
        
        if (manga.synopsis) {
            txt += `📖 *ꜱɪɴᴏᴘꜱɪꜱ*\n`;
            txt += `${manga.synopsis.substring(0, 500)}${manga.synopsis.length > 500 ? '...' : ''}\n\n`;
        }
        
        txt += `🔗 ${manga.url}`;
        
        if (manga.images?.jpg?.large_image_url) {
            await sock.sendMessage(m.chat, {
                image: { url: manga.images.jpg.large_image_url },
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
