/**
 * Group Analytics Dashboard - KYOKO MD Exclusive Feature
 * Show group activity statistics
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'groupstats',
    alias: ['gstats', 'grupstats', 'analytics'],
    category: 'group',
    description: 'Tampilkan statistik aktivitas grup',
    usage: '.groupstats',
    example: '.groupstats',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    try {
        const groupData = db.getGroup(m.chat) || {};
        const chatStats = groupData.chatStats || {};
        const totalChats = groupData.totalChats || 0;
        
        // Get top chatters
        const chatters = Object.entries(chatStats)
            .map(([jid, count]) => ({ jid, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        
        let txt = `📊 *ɢʀᴏᴜᴘ ᴀɴᴀʟʏᴛɪᴄꜱ*\n\n`;
        txt += `📝 Total Pesan: *${totalChats.toLocaleString()}*\n`;
        txt += `👥 Unique Chatters: *${Object.keys(chatStats).length}*\n\n`;
        
        if (chatters.length > 0) {
            txt += `🏆 *ᴛᴏᴘ 10 ᴀᴋᴛɪꜰ ᴍᴇᴍʙᴇʀ*\n\n`;
            
            const medals = ['🥇', '🥈', '🥉'];
            for (let i = 0; i < chatters.length; i++) {
                const { jid, count } = chatters[i];
                const number = jid.replace(/@.+/g, '');
                const medal = medals[i] || `${i + 1}.`;
                const percentage = totalChats > 0 ? ((count / totalChats) * 100).toFixed(1) : 0;
                txt += `${medal} @${number} - *${count}* (${percentage}%)\n`;
            }
            
            txt += `\n`;
        } else {
            txt += `> Belum ada data aktivitas grup.\n`;
        }
        
        // Additional stats
        const autoReplies = Object.keys(groupData.autoReplies || {}).length;
        const welcome = groupData.welcome ? '✅' : '❌';
        const goodbye = groupData.goodbye ? '✅' : '❌';
        const antilink = groupData.antilink ? '✅' : '❌';
        
        txt += `⚙️ *ꜱᴇᴛᴛɪɴɢꜱ*\n`;
        txt += `◦ Welcome: ${welcome}\n`;
        txt += `◦ Goodbye: ${goodbye}\n`;
        txt += `◦ Antilink: ${antilink}\n`;
        txt += `◦ Auto-Reply: *${autoReplies}*\n`;
        
        await sock.sendMessage(m.chat, {
            text: txt,
            mentions: chatters.map(c => c.jid)
        }, { quoted: m.raw || m });
        
    } catch (error) {
        console.error('[GroupStats] Error:', error.message);
        await m.reply('❌ Gagal mengambil statistik grup.');
    }
}

module.exports = { config: pluginConfig, handler };
