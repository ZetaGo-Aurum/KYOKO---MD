/**
 * Delete Auto-Reply - KYOKO MD Exclusive Feature
 * Remove auto-reply from group
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'delreply',
    alias: ['deletereply', 'hapusreply', 'removereply'],
    category: 'utility',
    description: 'Hapus auto-reply dari grup',
    usage: '.delreply <trigger>',
    example: '.delreply halo',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    if (!m.isAdmin && !m.isOwner) {
        return m.reply('❌ Hanya admin grup yang bisa menghapus auto-reply!');
    }
    
    const trigger = m.text?.trim()?.toLowerCase();
    
    if (!trigger) {
        return m.reply(`❌ Format: .delreply <trigger>`);
    }
    
    const groupData = db.getGroup(m.chat) || {};
    const autoReplies = groupData.autoReplies || {};
    
    if (!autoReplies[trigger]) {
        return m.reply(`❌ Auto-reply dengan trigger "${trigger}" tidak ditemukan.`);
    }
    
    delete autoReplies[trigger];
    db.setGroup(m.chat, { autoReplies });
    
    await m.reply(`✅ Auto-reply *${trigger}* berhasil dihapus!`);
}

module.exports = { config: pluginConfig, handler };
