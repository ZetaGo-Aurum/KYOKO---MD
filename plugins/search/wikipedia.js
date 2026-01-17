/**
 * Wikipedia Search - KYOKO MD Feature
 * Search Wikipedia articles
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'wikipedia',
    alias: ['wiki', 'wp'],
    category: 'search',
    description: 'Cari artikel Wikipedia',
    usage: '.wikipedia <query>',
    example: '.wikipedia Indonesia',
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
    const lang = 'id'; // Indonesian
    
    if (!query) {
        return m.reply(`❌ Format: .wikipedia <query>\n\nContoh: .wikipedia Sejarah Indonesia`);
    }
    
    await m.reply(`🔍 Mencari "${query}" di Wikipedia...`);
    
    try {
        // Search for article
        const searchUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const data = await fetchUrl(searchUrl);
        const json = JSON.parse(data);
        
        if (json.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
            // Try English Wikipedia
            const enUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
            const enData = await fetchUrl(enUrl);
            const enJson = JSON.parse(enData);
            
            if (enJson.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
                return m.reply(`❌ Artikel tidak ditemukan di Wikipedia.`);
            }
            
            return sendResult(m, sock, enJson);
        }
        
        await sendResult(m, sock, json);
        
    } catch (error) {
        await m.reply(`❌ Pencarian gagal: ${error.message}`);
    }
}

async function sendResult(m, sock, json) {
    let txt = `📖 *${json.title}*\n\n`;
    
    if (json.description) {
        txt += `_${json.description}_\n\n`;
    }
    
    if (json.extract) {
        txt += `${json.extract.substring(0, 1000)}${json.extract.length > 1000 ? '...' : ''}\n\n`;
    }
    
    txt += `🔗 ${json.content_urls?.desktop?.page || json.content_urls?.mobile?.page || ''}`;
    
    if (json.thumbnail?.source) {
        await sock.sendMessage(m.chat, {
            image: { url: json.thumbnail.source },
            caption: txt
        }, { quoted: m.raw || m });
    } else {
        await m.reply(txt);
    }
}

module.exports = { config: pluginConfig, handler };
