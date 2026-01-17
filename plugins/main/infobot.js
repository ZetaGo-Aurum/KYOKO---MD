/**
 * @file plugins/main/infobot.js
 * @description Plugin untuk menampilkan informasi lengkap bot
 * @author ZetaGo-Aurum
 * @version 2.0.0
 */

const config = require('../../config');
const { formatUptime } = require('../../src/lib/formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins');
const { getDatabase } = require('../../src/lib/database');
const fs = require('fs');

const pluginConfig = {
    name: 'infobot',
    alias: ['botinfo', 'info', 'about'],
    category: 'main',
    description: 'Menampilkan informasi lengkap tentang bot',
    usage: '.infobot',
    example: '.infobot',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, config: botConfig, db, uptime }) {
    try {
        const uptimeFormatted = formatUptime(uptime);
        const totalUsers = db.getUserCount();
        const commandsByCategory = getCommandsByCategory();
        
        let totalCommands = 0;
        for (const category of Object.keys(commandsByCategory)) {
            totalCommands += commandsByCategory[category].length;
        }
        
        const stats = db.getStats();
        const userStatus = m.isOwner ? 'Owner' : m.isPremium ? 'Premium' : 'Free User';
        const statusEmoji = m.isOwner ? '👑' : m.isPremium ? '💎' : '🆓';
        
        // ═══ KYOKO MD v2 STYLE ═══
        let txt = `\n`;
        txt += `┏━━━━━━━━━━━━━━━━━━━━━┓\n`;
        txt += `┃   🤖 *BOT INFO*         ┃\n`;
        txt += `┗━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        
        txt += `┌──「 *IDENTITY* 」\n`;
        txt += `│ 📛 *Name:* ${botConfig.bot?.name || 'KYOKO MD'}\n`;
        txt += `│ 📦 *Version:* v${botConfig.bot?.version || '2.0.0'}\n`;
        txt += `│ 👨‍💻 *Dev:* ${botConfig.bot?.developer || 'ZetaGo-Aurum'}\n`;
        txt += `│ 👑 *Owner:* ${botConfig.owner?.name || 'ZetaGo-Aurum'}\n`;
        txt += `│ ⚙️ *Mode:* ${(botConfig.mode || 'public').toUpperCase()}\n`;
        txt += `│ 🔑 *Prefix:* [ ${botConfig.command?.prefix || '.'} ]\n`;
        txt += `└────────────────\n\n`;
        
        txt += `┌──「 *STATISTICS* 」\n`;
        txt += `│ ⏱️ *Uptime:* ${uptimeFormatted}\n`;
        txt += `│ 👥 *Users:* ${totalUsers}\n`;
        txt += `│ 📋 *Commands:* ${totalCommands}\n`;
        txt += `│ ✅ *Executed:* ${stats.commandsExecuted || 0}\n`;
        txt += `└────────────────\n\n`;
        
        txt += `┌──「 *RUNTIME* 」\n`;
        txt += `│ 💾 *RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
        txt += `│ 📡 *Node:* ${process.version}\n`;
        txt += `│ 📚 *Library:* Baileys MD\n`;
        txt += `│ 🟢 *Status:* Online\n`;
        txt += `└────────────────\n\n`;
        
        txt += `> ${statusEmoji} *Your Status:* ${userStatus}\n`;
        txt += `> _KYOKO MD v2.0 • ${new Date().getFullYear()}_`;
        
        let thumbnail = null;
        try {
            const thumbPath = './assets/images/kyoko.jpg';
            const fallbackPath = './assets/images/ourin.jpg';
            if (fs.existsSync(thumbPath)) {
                thumbnail = fs.readFileSync(thumbPath);
            } else if (fs.existsSync(fallbackPath)) {
                thumbnail = fs.readFileSync(fallbackPath);
            }
        } catch (e) {}
        
        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: botConfig.saluran?.id || '',
                newsletterName: botConfig.saluran?.name || 'KYOKO MD',
                serverMessageId: 127
            },
            externalAdReply: {
                showAdAttribution: false,
                title: `KYOKO MD`,
                body: `${statusEmoji} ${userStatus} • v${botConfig.bot?.version || '2.0.0'}`,
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnail: thumbnail,
                sourceUrl: botConfig.saluran?.link || ''
            }
        };
        
        await sock.sendMessage(m.chat, {
            text: txt,
            contextInfo: contextInfo
        }, { quoted: m });
        
    } catch (error) {
        console.error('[Infobot Error]', error.message);
        await m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ❌ *ERROR*          ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> ${error.message}`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
