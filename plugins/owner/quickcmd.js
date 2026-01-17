/**
 * Quick Command Builder - KYOKO MD Exclusive Feature
 * Create dynamic commands without coding (Owner only)
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'addcmd',
    alias: ['createcmd', 'newcmd', 'buatcmd'],
    category: 'owner',
    description: 'Buat command custom tanpa coding (Owner only)',
    usage: '.addcmd <nama>|<response>',
    example: '.addcmd rules|📋 Rules Grup:\n1. Dilarang spam\n2. Sopan santun',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const text = m.text?.trim();
    if (!text || !text.includes('|')) {
        return m.reply(`❌ Format: .addcmd <nama>|<response>\n\nContoh: .addcmd rules|📋 Rules Grup:\\n1. Dilarang spam\\n2. Sopan santun\n\n> Gunakan \\n untuk baris baru`);
    }
    
    const [cmdName, ...responseParts] = text.split('|');
    const response = responseParts.join('|').trim().replace(/\\n/g, '\n');
    const name = cmdName.trim().toLowerCase();
    
    if (!name || !response) {
        return m.reply(`❌ Format: .addcmd <nama>|<response>`);
    }
    
    // Validate command name
    if (name.length < 2 || name.length > 20) {
        return m.reply(`❌ Nama command harus 2-20 karakter!`);
    }
    
    if (!/^[a-z0-9]+$/.test(name)) {
        return m.reply(`❌ Nama command hanya boleh huruf dan angka!`);
    }
    
    // Get custom commands
    const settings = db.db?.data?.settings || {};
    const customCmds = settings.customCommands || {};
    
    // Check if command exists in plugins
    const { getPlugin } = require('../../src/lib/plugins');
    if (getPlugin(name)) {
        return m.reply(`❌ Command \`${name}\` sudah ada sebagai plugin bawaan!`);
    }
    
    // Save custom command
    customCmds[name] = {
        response,
        createdBy: m.sender,
        createdAt: new Date().toISOString(),
        usageCount: 0
    };
    
    db.setting('customCommands', customCmds);
    
    await m.reply(`✅ *ᴄᴜꜱᴛᴏᴍ ᴄᴏᴍᴍᴀɴᴅ ᴅɪʙᴜᴀᴛ!*\n\n` +
        `📝 Command: \`.${name}\`\n` +
        `💬 Response:\n${response.substring(0, 150)}${response.length > 150 ? '...' : ''}\n\n` +
        `> Total custom commands: ${Object.keys(customCmds).length}`);
}

module.exports = { config: pluginConfig, handler };
