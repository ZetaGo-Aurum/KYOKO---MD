/**
 * Hash Generator - KYOKO MD Feature
 * Generate various hash types
 * Developer: ZetaGo-Aurum
 */

const crypto = require('crypto');

const pluginConfig = {
    name: 'hash',
    alias: ['md5', 'sha1', 'sha256', 'sha512'],
    category: 'tools',
    description: 'Generate hash dari text',
    usage: '.hash <algorithm> <text>',
    example: '.hash md5 password123',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const args = m.text?.trim()?.split(' ') || [];
    let algorithm = args[0]?.toLowerCase();
    let text = args.slice(1).join(' ');
    
    // If command is alias (md5, sha1, etc), use it as algorithm
    if (['md5', 'sha1', 'sha256', 'sha512'].includes(m.command)) {
        algorithm = m.command;
        text = m.text?.trim();
    }
    
    const validAlgorithms = ['md5', 'sha1', 'sha256', 'sha512', 'sha384'];
    
    if (!algorithm || !text || !validAlgorithms.includes(algorithm)) {
        return m.reply(`❌ Format: .hash <algorithm> <text>\n\nAlgorithm: md5, sha1, sha256, sha512\n\nContoh:\n• .hash md5 password123\n• .sha256 secret`);
    }
    
    try {
        const hash = crypto.createHash(algorithm).update(text).digest('hex');
        
        await m.reply(`🔐 *ʜᴀꜱʜ ɢᴇɴᴇʀᴀᴛᴏʀ*\n\n` +
            `📝 Input: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\n` +
            `🔧 Algorithm: ${algorithm.toUpperCase()}\n\n` +
            `\`\`\`${hash}\`\`\``);
        
    } catch (error) {
        await m.reply(`❌ Error: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
