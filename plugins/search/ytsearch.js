/**
 * YouTube Search - KYOKO MD Feature
 * Search YouTube videos
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'ytsearch',
    alias: ['youtube', 'yt', 'searchyt'],
    category: 'search',
    description: 'Cari video YouTube',
    usage: '.ytsearch <query>',
    example: '.ytsearch Tutorial Node.js',
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
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function handler(m, { sock }) {
    const query = m.text?.trim();
    
    if (!query) {
        return m.reply(`❌ Format: .ytsearch <query>\n\nContoh: .ytsearch Tutorial JavaScript`);
    }
    
    await m.reply(`🔍 Mencari "${query}" di YouTube...`);
    
    try {
        // Use ytsr scraping method
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const html = await fetchUrl(searchUrl);
        
        // Extract video data from initial data
        const match = html.match(/var ytInitialData = (.+?);<\/script>/);
        if (!match) {
            return m.reply(`❌ Gagal mengambil hasil pencarian.`);
        }
        
        const data = JSON.parse(match[1]);
        const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
        
        if (!contents) {
            return m.reply(`❌ Tidak ada hasil ditemukan.`);
        }
        
        const videos = contents
            .filter(item => item.videoRenderer)
            .slice(0, 5)
            .map(item => {
                const v = item.videoRenderer;
                return {
                    id: v.videoId,
                    title: v.title?.runs?.[0]?.text || 'Unknown',
                    duration: v.lengthText?.simpleText || 'Live',
                    views: v.viewCountText?.simpleText || '-',
                    channel: v.ownerText?.runs?.[0]?.text || 'Unknown',
                    uploaded: v.publishedTimeText?.simpleText || '-'
                };
            });
        
        if (videos.length === 0) {
            return m.reply(`❌ Tidak ada video ditemukan.`);
        }
        
        let txt = `🎬 *ʏᴏᴜᴛᴜʙᴇ ꜱᴇᴀʀᴄʜ*\n`;
        txt += `🔍 Query: "${query}"\n\n`;
        
        videos.forEach((v, i) => {
            txt += `${i + 1}. *${v.title.substring(0, 50)}*\n`;
            txt += `   ⏱️ ${v.duration} • 👁️ ${v.views}\n`;
            txt += `   📺 ${v.channel}\n`;
            txt += `   🔗 https://youtu.be/${v.id}\n\n`;
        });
        
        await m.reply(txt);
        
    } catch (error) {
        await m.reply(`❌ Pencarian gagal: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
