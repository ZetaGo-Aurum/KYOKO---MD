/**
 * URL Shortener - KYOKO MD Feature
 * Shorten URLs using TinyURL
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'shorturl',
    alias: ['short', 'tinyurl', 'shorten'],
    category: 'tools',
    description: 'Shorten URL',
    usage: '.shorturl <url>',
    example: '.shorturl https://very-long-url.com/path/to/page',
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
    let url = m.text?.trim();
    
    if (!url) {
        return m.reply(`❌ Format: .shorturl <url>\n\nContoh: .shorturl https://example.com/very/long/path`);
    }
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        return m.reply(`❌ URL tidak valid!`);
    }
    
    await m.reply(`⏳ Shortening URL...`);
    
    try {
        const shortUrl = await fetchUrl(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        
        if (shortUrl.startsWith('http')) {
            await m.reply(`🔗 *ᴜʀʟ ꜱʜᴏʀᴛᴇɴᴇᴅ*\n\n` +
                `📎 Original: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}\n` +
                `✨ Short: ${shortUrl}`);
        } else {
            await m.reply(`❌ Gagal shorten URL.`);
        }
        
    } catch (error) {
        await m.reply(`❌ Error: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
