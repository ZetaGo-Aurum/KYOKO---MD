/**
 * Text to Binary/Hex - KYOKO MD Feature
 * Convert text to binary or hex
 * Developer: ZetaGo-Aurum
 */

const pluginConfig = {
    name: 'tobin',
    alias: ['binary', 'tobinary', 'bin'],
    category: 'tools',
    description: 'Convert text ke binary',
    usage: '.tobin <text>',
    example: '.tobin Hello',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`❌ Format: .tobin <text>\n\nContoh: .tobin Hello World`);
    }
    
    try {
        // Text to Binary
        const binary = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
        
        // Text to Hex
        const hex = Buffer.from(text).toString('hex').toUpperCase().match(/.{2}/g).join(' ');
        
        await m.reply(`🔢 *ᴛᴇxᴛ ᴄᴏɴᴠᴇʀᴛᴇʀ*\n\n` +
            `📝 Input: ${text.substring(0, 50)}\n\n` +
            `💻 *Binary:*\n\`\`\`${binary}\`\`\`\n\n` +
            `🔣 *Hex:*\n\`\`\`${hex}\`\`\``);
        
    } catch (error) {
        await m.reply(`❌ Error: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
