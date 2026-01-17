/**
 * Base64 Encoder/Decoder - KYOKO MD Feature
 * Encode/decode base64 strings
 * Developer: ZetaGo-Aurum
 */

const pluginConfig = {
    name: 'base64',
    alias: ['b64', 'encode64', 'decode64'],
    category: 'tools',
    description: 'Encode/decode base64',
    usage: '.base64 <encode|decode> <text>',
    example: '.base64 encode Hello World',
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
    const action = args[0]?.toLowerCase();
    const text = args.slice(1).join(' ');
    
    if (!action || !text || !['encode', 'decode', 'e', 'd'].includes(action)) {
        return m.reply(`❌ Format: .base64 <encode|decode> <text>\n\nContoh:\n• .base64 encode Hello World\n• .base64 decode SGVsbG8gV29ybGQ=`);
    }
    
    try {
        let result;
        
        if (action === 'encode' || action === 'e') {
            result = Buffer.from(text).toString('base64');
            await m.reply(`🔐 *ʙᴀꜱᴇ64 ᴇɴᴄᴏᴅᴇᴅ*\n\n\`\`\`${result}\`\`\``);
        } else {
            result = Buffer.from(text, 'base64').toString('utf-8');
            await m.reply(`🔓 *ʙᴀꜱᴇ64 ᴅᴇᴄᴏᴅᴇᴅ*\n\n${result}`);
        }
        
    } catch (error) {
        await m.reply(`❌ Error: ${error.message}`);
    }
}

module.exports = { config: pluginConfig, handler };
