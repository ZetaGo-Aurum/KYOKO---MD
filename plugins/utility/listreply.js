/**
 * List Auto-Reply - KYOKO MD Exclusive Feature
 * View all auto-replies in group
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'listreply',
    alias: ['replies', 'autoreplies'],
    category: 'utility',
    description: 'Lihat semua auto-reply di grup',
    usage: '.listreply',
    example: '.listreply',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const groupData = db.getGroup(m.chat) || {};
    const autoReplies = groupData.autoReplies || {};
    const triggers = Object.keys(autoReplies);
    
    if (triggers.length === 0) {
        return m.reply(`💬 *ᴀᴜᴛᴏ-ʀᴇᴘʟʏ ɢʀᴜᴘ*\n\n> Belum ada auto-reply di grup ini.\n> Gunakan \`.setreply <trigger>|<response>\` untuk menambahkan.`);
    }
    
    let txt = `💬 *ᴀᴜᴛᴏ-ʀᴇᴘʟʏ ɢʀᴜᴘ* (${triggers.length})\n\n`;
    
    triggers.forEach((key, i) => {
        const ar = autoReplies[key];
        const preview = ar.response.substring(0, 25) + (ar.response.length > 25 ? '...' : '');
        txt += `${i + 1}. \`${key}\` → ${preview}\n`;
    });
    
    txt += `\n> Gunakan \`.delreply <trigger>\` untuk menghapus`;
    
    await m.reply(txt);
}

module.exports = { config: pluginConfig, handler };
