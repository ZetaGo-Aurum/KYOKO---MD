/**
 * NPM Search - KYOKO MD Feature
 * Search NPM packages
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'npm',
    alias: ['npmsearch', 'package'],
    category: 'search',
    description: 'Cari package NPM',
    usage: '.npm <package>',
    example: '.npm axios',
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
        return m.reply(`❌ Format: .npm <package>\n\nContoh: .npm express`);
    }
    
    await m.reply(`🔍 Mencari "${query}" di NPM...`);
    
    try {
        const data = await fetchUrl(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=5`);
        const json = JSON.parse(data);
        
        if (!json.objects || json.objects.length === 0) {
            return m.reply(`❌ Package tidak ditemukan.`);
        }
        
        let txt = `📦 *ɴᴘᴍ ꜱᴇᴀʀᴄʜ*\n`;
        txt += `🔍 Query: "${query}"\n\n`;
        
        json.objects.forEach((item, i) => {
            const pkg = item.package;
            txt += `${i + 1}. *${pkg.name}* v${pkg.version}\n`;
            if (pkg.description) {
                txt += `   📝 ${pkg.description.substring(0, 60)}${pkg.description.length > 60 ? '...' : ''}\n`;
            }
            txt += `   👤 ${pkg.publisher?.username || 'Unknown'}\n`;
            txt += `   🔗 https://npmjs.com/package/${pkg.name}\n\n`;
        });
        
        await m.reply(txt);
        
    } catch (error) {
        await m.reply(`❌ Pencarian gagal: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
