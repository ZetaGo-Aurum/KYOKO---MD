/**
 * GitHub Search - KYOKO MD Feature
 * Search GitHub repositories
 * Developer: ZetaGo-Aurum
 */

const https = require('https');

const pluginConfig = {
    name: 'github',
    alias: ['gh', 'ghsearch', 'repo'],
    category: 'search',
    description: 'Cari repository GitHub',
    usage: '.github <query>',
    example: '.github whatsapp bot',
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
        const options = {
            hostname: 'api.github.com',
            path: url,
            headers: { 
                'User-Agent': 'KYOKO-MD/1.0',
                'Accept': 'application/vnd.github.v3+json'
            }
        };
        
        const req = https.get(options, (res) => {
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
        return m.reply(`❌ Format: .github <query>\n\nContoh: .github whatsapp bot nodejs`);
    }
    
    await m.reply(`🔍 Mencari "${query}" di GitHub...`);
    
    try {
        const data = await fetchUrl(`/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=5`);
        const json = JSON.parse(data);
        
        if (!json.items || json.items.length === 0) {
            return m.reply(`❌ Repository tidak ditemukan.`);
        }
        
        let txt = `🐙 *ɢɪᴛʜᴜʙ ꜱᴇᴀʀᴄʜ*\n`;
        txt += `🔍 Query: "${query}"\n`;
        txt += `📊 Total: ${json.total_count.toLocaleString()} results\n\n`;
        
        json.items.forEach((repo, i) => {
            txt += `${i + 1}. *${repo.full_name}*\n`;
            txt += `   ⭐ ${repo.stargazers_count.toLocaleString()} • 🍴 ${repo.forks_count}\n`;
            if (repo.description) {
                txt += `   📝 ${repo.description.substring(0, 60)}${repo.description.length > 60 ? '...' : ''}\n`;
            }
            txt += `   📦 ${repo.language || 'Unknown'}\n`;
            txt += `   🔗 ${repo.html_url}\n\n`;
        });
        
        await m.reply(txt);
        
    } catch (error) {
        await m.reply(`❌ Pencarian gagal: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
