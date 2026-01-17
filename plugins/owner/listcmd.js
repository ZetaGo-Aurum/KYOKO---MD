/**
 * List Custom Commands - KYOKO MD Exclusive Feature
 * View all custom commands
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'listcmd',
    alias: ['customcmds', 'mycmds'],
    category: 'owner',
    description: 'Lihat semua custom command',
    usage: '.listcmd',
    example: '.listcmd',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const settings = db.db?.data?.settings || {};
    const customCmds = settings.customCommands || {};
    const cmdNames = Object.keys(customCmds);
    
    if (cmdNames.length === 0) {
        return m.reply(`📝 *ᴄᴜꜱᴛᴏᴍ ᴄᴏᴍᴍᴀɴᴅꜱ*\n\n> Belum ada custom command.\n> Gunakan \`.addcmd <nama>|<response>\` untuk membuat.`);
    }
    
    let txt = `📝 *ᴄᴜꜱᴛᴏᴍ ᴄᴏᴍᴍᴀɴᴅꜱ* (${cmdNames.length})\n\n`;
    
    cmdNames.forEach((name, i) => {
        const cmd = customCmds[name];
        const preview = cmd.response.substring(0, 30) + (cmd.response.length > 30 ? '...' : '');
        txt += `${i + 1}. \`.${name}\` - ${preview}\n`;
        txt += `   └ Used: ${cmd.usageCount || 0}x\n`;
    });
    
    txt += `\n> \`.delcmd <nama>\` untuk menghapus`;
    
    await m.reply(txt);
}

module.exports = { config: pluginConfig, handler };
