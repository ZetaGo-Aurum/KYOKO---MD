/**
 * Anime Search - KYOKO MD Feature
 * Search anime information
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'anime',
    alias: ['animesearch', 'mal', 'searchanime'],
    category: 'anime',
    description: 'Cari informasi anime',
    usage: '.anime <judul>',
    example: '.anime Naruto',
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
        return m.reply(`❌ Format: .anime <judul>\n\nContoh: .anime Naruto Shippuden`);
    }
    
    await m.reply(`🔍 Mencari anime "${query}"...`);
    
    try {
        const data = await fetchUrl(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
        const json = JSON.parse(data);
        
        if (!json.data || json.data.length === 0) {
            return m.reply(`❌ Anime tidak ditemukan!`);
        }
        
        const anime = json.data[0];
        
        let txt = `🎬 *${anime.title}*\n`;
        if (anime.title_japanese) txt += `   ${anime.title_japanese}\n`;
        txt += `\n`;
        
        txt += `📊 *ɪɴꜰᴏ*\n`;
        txt += `◦ Type: ${anime.type || '-'}\n`;
        txt += `◦ Episodes: ${anime.episodes || '?'}\n`;
        txt += `◦ Status: ${anime.status || '-'}\n`;
        txt += `◦ Score: ⭐ ${anime.score || '-'}/10\n`;
        txt += `◦ Rank: #${anime.rank || '-'}\n`;
        txt += `◦ Rating: ${anime.rating || '-'}\n`;
        txt += `◦ Duration: ${anime.duration || '-'}\n`;
        txt += `◦ Season: ${anime.season ? `${anime.season} ${anime.year}` : '-'}\n`;
        txt += `◦ Studio: ${anime.studios?.map(s => s.name).join(', ') || '-'}\n\n`;
        
        txt += `📝 *ɢᴇɴʀᴇꜱ*\n`;
        txt += `${anime.genres?.map(g => g.name).join(', ') || '-'}\n\n`;
        
        if (anime.synopsis) {
            txt += `📖 *ꜱɪɴᴏᴘꜱɪꜱ*\n`;
            txt += `${anime.synopsis.substring(0, 500)}${anime.synopsis.length > 500 ? '...' : ''}\n\n`;
        }
        
        txt += `🔗 ${anime.url}`;
        
        // Send with image if available
        if (anime.images?.jpg?.large_image_url) {
            await sock.sendMessage(m.chat, {
                image: { url: anime.images.jpg.large_image_url },
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
