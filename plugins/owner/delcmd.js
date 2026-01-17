/**
 * Delete Custom Command - KYOKO MD Exclusive Feature
 * Remove custom command
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'delcmd',
    alias: ['deletecmd', 'removecmd', 'hapuscmd'],
    category: 'owner',
    description: 'Hapus command custom',
    usage: '.delcmd <nama>',
    example: '.delcmd rules',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const cmdName = m.text?.trim()?.toLowerCase();
    
    if (!cmdName) {
        return m.reply(`❌ Format: .delcmd <nama>`);
    }
    
    const settings = db.db?.data?.settings || {};
    const customCmds = settings.customCommands || {};
    
    if (!customCmds[cmdName]) {
        return m.reply(`❌ Custom command \`${cmdName}\` tidak ditemukan.`);
    }
    
    delete customCmds[cmdName];
    db.setting('customCommands', customCmds);
    
    await m.reply(`✅ Custom command *${cmdName}* berhasil dihapus!`);
}

module.exports = { config: pluginConfig, handler };
