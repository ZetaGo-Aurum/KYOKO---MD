const config = require('../../config');
const { formatUptime, getTimeGreeting } = require('../../src/lib/formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins');
const { getDatabase } = require('../../src/lib/database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateWAMessageFromContent, proto } = require('ourin');
/**
 * Credits & Thanks to
 * Developer = ZetaGo-Aurum
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEKS
 */
const pluginConfig = {
    name: 'menu',
    alias: ['help', 'bantuan', 'commands', 'm'],
    category: 'main',
    description: 'Menampilkan menu utama bot',
    usage: '.menu',
    example: '.menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

const CATEGORY_EMOJIS = {
    owner: '👑', main: '🏠', utility: '🔧', fun: '🎮', group: '👥',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️',
    ai: '🤖', game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️',
    panel: '🖥️', user: '📊', anime: '🎌', pentest: '🛡️', canvas: '🎨',
    cek: '✅', convert: '🔄', dan: '📦', jpm: '💰', pushkontak: '📱',
    primbon: '🔮', rpg: '⚔️'
};

// NSFW marker for 18+ content
const NSFW_COMMANDS = ['hentai', 'nsfw', 'nsfwwaifu', 'lewdwaifu', 'ecchi', '18+', 'hentaiconfirm', 'ya18', 'tidak18'];



function toSmallCaps(text) {
    const smallCaps = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ',
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => smallCaps[c] || c).join('');
}

function formatTime(date) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateShort(date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function buildMenuText(m, botConfig, db, uptime, botMode = 'md') {
    const prefix = botConfig.command?.prefix || '.';
    const user = db.getUser(m.sender);
    const now = new Date();
    const timeStr = formatTime(now);
    const dateStr = formatDateShort(now);
    
    const categories = getCategories();
    const commandsByCategory = getCommandsByCategory();
    
    let totalCommands = 0;
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length;
    }
    
    // Helper to get proper user display name
    function getUserDisplayName() {
        // If bot is sending (fromMe), use bot's name
        if (m.fromMe) {
            return m.botName || botConfig.bot?.name || 'KYOKO MD';
        }
        
        const pushName = m.pushName;
        
        // Check if pushName is valid (not Unknown, not empty, not just numbers)
        if (pushName && 
            pushName !== 'Unknown' && 
            pushName.trim() !== '' &&
            !/^[\d\s\+\-\(\)]+$/.test(pushName)) {  // Not just phone number format
            return pushName;
        }
        
        // Fallback to database stored name
        if (user?.name && 
            user.name !== 'Unknown' && 
            user.name.trim() !== '' &&
            !/^[\d\s\+\-\(\)]+$/.test(user.name)) {
            return user.name;
        }
        
        // Final fallback
        return 'User';
    }
    
    const displayName = getUserDisplayName();
    
    let userRole = 'User', roleEmoji = '👤', roleStar = '○';
    if (m.isOwner) { userRole = 'Owner'; roleEmoji = '👑'; roleStar = '★'; }
    else if (m.isPremium) { userRole = 'Premium'; roleEmoji = '💎'; roleStar = '◆'; }
    
    const greeting = getTimeGreeting();
    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    const greetEmoji = greeting.includes('pagi') ? '🌅' : greeting.includes('siang') ? '☀️' : greeting.includes('sore') ? '🌇' : '🌙';
    
    const botName = botConfig.bot?.name || 'KYOKO MD';
    const version = botConfig.bot?.version || '1.3.1';
    const developer = botConfig.bot?.developer || 'ZetaGo-Aurum';
    
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const nodeVersion = process.version;
    const platform = process.platform;
    
    let txt = ``;
    
    // ═══════════════════════════════════════
    // PREMIUM HEADER
    // ═══════════════════════════════════════
    txt += `▸▸▸ *${botName}* ◂◂◂\n`;
    txt += `> ᴠ${version} ┃ ${(botConfig.mode || 'public').toUpperCase()}\n\n`;
    
    // ═══════════════════════════════════════
    // WELCOME - Stylish & Complete
    // ═══════════════════════════════════════
    txt += `${greetEmoji} *${greeting}!*\n\n`;
    txt += `> ☆ Halo, *${displayName}*\n`;
    txt += `> ☆ Selamat datang di *${botName}*\n`;
    txt += `> ☆ Bot WhatsApp Multi-Device\n`;
    txt += `> ☆ Fast • Reliable • Premium\n\n`;
    txt += `> 📅 ${dateStr}\n`;
    txt += `> ⏰ ${timeStr} WIB\n\n`;
    
    // ═══════════════════════════════════════
    // BOT STATUS - Premium Box
    // ═══════════════════════════════════════
    txt += `╭───〘 🤖 *ʙᴏᴛ sᴛᴀᴛᴜs* 〙───╮\n`;
    txt += `│\n`;
    txt += `│ ◈ Uptime: ${uptimeFormatted}\n`;
    txt += `│ ◈ Node: ${nodeVersion}\n`;
    txt += `│ ◈ RAM: ${memUsedMB}MB\n`;
    txt += `│ ◈ OS: ${platform}\n`;
    txt += `│\n`;
    txt += `╰────────────────────╯\n\n`;
    
    // ═══════════════════════════════════════
    // USER INFO - Premium Box
    // ═══════════════════════════════════════
    txt += `╭───〘 ${roleEmoji} *ᴜsᴇʀ ɪɴꜰᴏ* 〙───╮\n`;
    txt += `│\n`;
    txt += `│ ${roleStar} Nama: ${displayName}\n`;
    txt += `│ ${roleStar} Role: ${userRole}\n`;
    txt += `│ ${roleStar} Limit: ${m.isOwner || m.isPremium ? '∞ Unlimited' : (user?.limit ?? 25)}\n`;
    txt += `│ ${roleStar} Users: ${totalUsers} total\n`;
    txt += `│\n`;
    txt += `╰────────────────────╯\n\n`;
    
    // ═══════════════════════════════════════
    // FEATURES HEADER
    // ═══════════════════════════════════════
    txt += `┏━━━━━━━━━━━━━━━━━━┓\n`;
    txt += `┃  ⚡ *ꜰᴇᴀᴛᴜʀᴇs* ⚡\n`;
    txt += `┃  📦 ${totalCommands} Commands\n`;
    txt += `┗━━━━━━━━━━━━━━━━━━┛\n\n`;
    
    const categoryOrder = ['owner', 'main', 'ai', 'pentest', 'anime', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'group', 'canvas', 'convert', 'cek', 'dan', 'jpm', 'pushkontak', 'primbon', 'rpg', 'religi', 'info', 'user'];
    const sortedCategories = categories.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    if (botMode === 'cpanel') {
        txt += `╭──〘 📦 *sᴇʀᴠᴇʀ* 〙\n`;
        for (let i = 0; i <= 11; i++) {
            txt += `│ ▸ _${prefix}${i + 1}gb_\n`;
        }
        txt += `│ ▸ _${prefix}unli_\n`;
        txt += `╰─────────────\n\n`;
        
        txt += `╭──〘 👥 *sᴇʟʟᴇʀ* 〙\n`;
        txt += `│ ▸ _${prefix}addseller_\n`;
        txt += `│ ▸ _${prefix}delseller_\n`;
        txt += `│ ▸ _${prefix}listseller_\n`;
        txt += `╰─────────────\n\n`;
        
        txt += `╭──〘 🔐 *ᴀᴅᴍɪɴ* 〙\n`;
        txt += `│ ▸ _${prefix}cadmin_\n`;
        txt += `│ ▸ _${prefix}deladmin_\n`;
        txt += `│ ▸ _${prefix}listadmin_\n`;
        txt += `╰─────────────\n\n`;
    } else {
        for (const category of sortedCategories) {
            if (category === 'owner' && !m.isOwner) continue;
            if (category === 'panel') continue;
            const commands = commandsByCategory[category] || [];
            if (commands.length === 0) continue;
            
            const emoji = CATEGORY_EMOJIS[category] || '📋';
            const categoryName = toSmallCaps(category);
            
            // Special decorators for categories
            let deco = '◇';
            if (category === 'pentest') deco = '🔒';
            else if (category === 'anime') deco = '✿';
            else if (category === 'ai') deco = '🔥';
            else if (category === 'owner') deco = '⭐';
            else if (category === 'game') deco = '🎮';
            else if (category === 'download') deco = '📥';
            
            // Premium category header
            txt += `╭──〘 ${emoji} *${categoryName}* ${deco} 〙\n`;
            
            // Commands with elegant bullet
            for (const cmd of commands) {
                const isNSFW = NSFW_COMMANDS.includes(cmd);
                const mark = isNSFW ? ' 🔞' : '';
                txt += `│ ▸ _${prefix}${cmd}_${mark}\n`;
            }
            
            txt += `╰─────────────\n\n`;
        }
    }
    
    // ═══════════════════════════════════════
    // PREMIUM FOOTER
    // ═══════════════════════════════════════
    txt += `> ━━━━━━━━━━━━━━━━\n`;
    txt += `> 💫 *${botName}*\n`;
    txt += `> 👨‍💻 Dev: ${developer}\n`;
    txt += `> ⚙️ Baileys Engine\n`;
    txt += `> © ${new Date().getFullYear()} All Rights Reserved\n`;
    txt += `> ━━━━━━━━━━━━━━━━`;
    
    return txt;
}





function getContextInfo(botConfig, m, thumbBuffer, renderLargerThumbnail = false) {
    const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'KYOKO MD';
    const saluranLink = botConfig.saluran?.link || '';
    
    const ctx = {
        mentionedJid: [m.sender],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: botConfig.bot?.name || 'KYOKO MD',
            body: `ᴠ${botConfig.bot?.version || '1.2.0'} • ${(botConfig.mode || 'public').toUpperCase()}`,
            sourceUrl: saluranLink,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail
        }
    };
    
    if (thumbBuffer) ctx.externalAdReply.thumbnail = thumbBuffer;
    return ctx;
}

function getVerifiedQuoted(botConfig) {
    const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'KYOKO MD';
    
    return {
        key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
        message: {
            extendedTextMessage: {
                text: `✨ *${botConfig.bot?.name || 'KYOKO MD'}* ✨\nꜰᴀsᴛ ʀᴇsᴘᴏɴsᴇ ʙᴏᴛ`,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 9999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            }
        }
    };
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
    const savedVariant = db.setting('menuVariant');
    const menuVariant = savedVariant || botConfig.ui?.menuVariant || 2;
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {};
    const botMode = groupData.botMode || 'md';
    const text = buildMenuText(m, botConfig, db, uptime, botMode);
    
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'kyoko.jpg');
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'kyoko2.jpg');
    const videoPath = path.join(process.cwd(), 'assets', 'video', 'kyoko.mp4');
    
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
    let thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;
    let videoBuffer = fs.existsSync(videoPath) ? fs.readFileSync(videoPath) : null;
    
    try {
        switch (menuVariant) {
            case 1:
                if (imageBuffer) {
                    await sock.sendMessage(m.chat, { image: imageBuffer, caption: text });
                } else {
                    await m.reply(text);
                }
                break;
                
            case 2:
                // Menu V2: Standard with Image + Caption + Thumbnail (Works on ALL platforms)
                const saluranIdV2 = botConfig.saluran?.id || '120363208449943317@newsletter';
                const saluranNameV2 = botConfig.saluran?.name || botConfig.bot?.name || 'KYOKO MD';
                
                // Load thumbnail from ourin.jpg
                const ourinPath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
                const ourinThumb = fs.existsSync(ourinPath) ? fs.readFileSync(ourinPath) : thumbBuffer;
                
                // Context info with thumbnail that works on all platforms
                const contextInfoV2 = {
                    mentionedJid: [m.sender],
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranIdV2,
                        newsletterName: saluranNameV2,
                        serverMessageId: 127
                    },
                    externalAdReply: {
                        title: botConfig.bot?.name || 'KYOKO MD',
                        body: `v${botConfig.bot?.version || '2.0'} • Fast Response Bot`,
                        sourceUrl: botConfig.saluran?.link || '',
                        mediaType: 1,
                        showAdAttribution: false,
                        renderLargerThumbnail: true,
                        thumbnail: ourinThumb
                    }
                };
                
                const msgV2 = { contextInfo: contextInfoV2 };
                if (imageBuffer) {
                    msgV2.image = imageBuffer;
                    msgV2.caption = text;
                } else {
                    msgV2.text = text;
                }
                await sock.sendMessage(m.chat, msgV2, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 3:
                let resizedThumb = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        resizedThumb = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        resizedThumb = thumbBuffer;
                    }
                }
                await sock.sendMessage(m.chat, {
                    document: imageBuffer || Buffer.from(''),
                    mimetype: 'ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ',
                    fileLength: 9999999999,
                    fileSize: 9999999999,
                    caption: text,
                    jpegThumbnail: resizedThumb,
                    contextInfo: getContextInfo(botConfig, m, fs.readFileSync(path.join(process.cwd(), 'assets', 'images', 'ourin.jpg')) || 'KYOKO MD', true)
                }, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 4:
                if (videoBuffer) {
                    await sock.sendMessage(m.chat, {
                        video: videoBuffer,
                        caption: text,
                        gifPlayback: true,
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                    }, { quoted: getVerifiedQuoted(botConfig) });
                } else {
                    const fallback = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallback.image = imageBuffer; fallback.caption = text; }
                    else { fallback.text = text; }
                    await sock.sendMessage(m.chat, fallback, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 5:
                const prefix = botConfig.command?.prefix || '.';
                const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter';
                const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'KYOKO MD';
                
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = categories.sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
                        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
                        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
                        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                
                const now = new Date();
                const greeting = getTimeGreeting();
                const greetEmoji = greeting.includes('pagi') ? '🌅' : greeting.includes('siang') ? '☀️' : greeting.includes('sore') ? '🌇' : '🌙';
                const uptimeFormatted = formatUptime(uptime);
                
                // Build header text
                let headerText = `${greetEmoji} *ʜᴀʟʟᴏ, ${m.pushName || 'User'}!*\n\n`;
                headerText += `> *${greeting}!* sᴇʟᴀᴍᴀᴛ ᴅᴀᴛᴀɴɢ ᴅɪ *${botConfig.bot?.name || 'KYOKO MD'}* ✨\n\n`;
                headerText += `╭┈┈⬡「 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 」\n`;
                headerText += `┃ ◦ ɴᴀᴍᴀ: *${botConfig.bot?.name || 'KYOKO MD'}*\n`;
                headerText += `┃ ◦ ᴠᴇʀsɪ: *v${botConfig.bot?.version || '1.2.0'}*\n`;
                headerText += `┃ ◦ ᴍᴏᴅᴇ: *${(botConfig.mode || 'public').toUpperCase()}*\n`;
                headerText += `┃ ◦ ᴜᴘᴛɪᴍᴇ: *${uptimeFormatted}*\n`;
                headerText += `┃ ◦ ᴛᴏᴛᴀʟ ᴄᴍᴅ: *${totalCmds}*\n`;
                headerText += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
                
                // Build category list
                headerText += `╭┈┈⬡「 📋 *ᴘɪʟɪʜ ᴋᴀᴛᴇɢᴏʀɪ* 」\n`;
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    headerText += `┃ ${emoji} \`${prefix}menucat ${cat}\` _(${cmds.length})_\n`;
                }
                headerText += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
                
                // Quick actions
                headerText += `╭┈┈⬡「 ⚡ *ᴀᴋsɪ ᴄᴇᴘᴀᴛ* 」\n`;
                headerText += `┃ 📊 \`${prefix}totalfitur\` - Statistik fitur\n`;
                headerText += `┃ 🎨 \`${prefix}setmenu\` - Ganti tampilan\n`;
                headerText += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
                
                headerText += `> 💡 _Ketik perintah kategori untuk melihat daftar command_\n`;
                headerText += `_© ${botConfig.bot?.name || 'KYOKO MD'} | ${sortedCats.filter(c => (commandsByCategory[c] || []).length > 0).length} Categories_`;
                
                try {
                    // Send as image with caption - works on all platforms
                    const msgV5 = {
                        image: imageBuffer,
                        caption: headerText,
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            },
                            externalAdReply: {
                                title: botConfig.bot?.name || 'KYOKO MD',
                                body: `v${botConfig.bot?.version || '1.2.0'} • ${totalCmds} Commands`,
                                sourceUrl: botConfig.saluran?.link || '',
                                mediaType: 1,
                                showAdAttribution: false,
                                renderLargerThumbnail: true,
                                thumbnail: thumbBuffer
                            }
                        }
                    };
                    
                    if (imageBuffer) {
                        await sock.sendMessage(m.chat, msgV5, { quoted: getVerifiedQuoted(botConfig) });
                    } else {
                        // Fallback to text if no image
                        await sock.sendMessage(m.chat, { 
                            text: headerText,
                            contextInfo: msgV5.contextInfo
                        }, { quoted: getVerifiedQuoted(botConfig) });
                    }
                    
                } catch (btnError) {
                    console.error('[Menu V5] Error:', btnError.message);
                    
                    // Simple fallback
                    const fallbackMsg = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackMsg.image = imageBuffer; fallbackMsg.caption = headerText; }
                    else { fallbackMsg.text = headerText; }
                    await sock.sendMessage(m.chat, fallbackMsg, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 6:
                const thumbPathV6 = path.join(process.cwd(), 'assets', 'images', 'kyoko3.jpg');
                const saluranIdV6 = botConfig.saluran?.id || '120363208449943317@newsletter';
                const saluranNameV6 = botConfig.saluran?.name || botConfig.bot?.name || 'KYOKO MD';
                const saluranLinkV6 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t';
                
                let bannerThumbV6 = null;
                
                try {
                    const sourceBuffer = fs.existsSync(thumbPathV6) 
                        ? fs.readFileSync(thumbPathV6) 
                        : (thumbBuffer || imageBuffer);
                    
                    if (sourceBuffer) {
                        bannerThumbV6 = await sharp(sourceBuffer)
                            .resize(200, 200, { fit: 'inside' })
                            .jpeg({ quality: 90 })
                            .toBuffer();
                    }
                } catch (resizeErr) {
                    console.error('[Menu V6] Resize error:', resizeErr.message);
                    bannerThumbV6 = thumbBuffer;
                }
                
                const contextInfoV6 = {
                    mentionedJid: [m.sender],
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranIdV6,
                        newsletterName: saluranNameV6,
                        serverMessageId: 127
                    },
                    externalAdReply: {
                        title: botConfig.bot?.name || 'KYOKO MD',
                        body: `v${botConfig.bot?.version || '1.0.1'} • Fast Response Bot`,
                        sourceUrl: saluranLinkV6,
                        mediaType: 1,
                        showAdAttribution: false,
                        renderLargerThumbnail: true,
                        thumbnail: fs.existsSync('./assets/images/kyoko.jpg') ? fs.readFileSync('./assets/images/kyoko.jpg') : thumbBuffer
                    }
                };
                
                try {
                    await sock.sendMessage(m.chat, {
                        document: imageBuffer || Buffer.from('KYOKO MD Menu'),
                        mimetype: 'application/pdf',
                        fileName: `ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ`,
                        fileLength: 9999999999,
                        caption: text,
                        jpegThumbnail: bannerThumbV6,
                        contextInfo: contextInfoV6
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    
                } catch (v6Error) {
                    console.error('[Menu V6] Error:', v6Error.message);
                    const fallbackV6 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV6.image = imageBuffer; fallbackV6.caption = text; }
                    else { fallbackV6.text = text; }
                    await sock.sendMessage(m.chat, fallbackV6, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            default:
                await m.reply(text);
        }
        const audioPath = path.join(process.cwd(), 'assets', 'audio', 'kyoko.mp3');
        if (fs.existsSync(audioPath)) {
            const { execSync } = require('child_process');
            const tempOpus = path.join(process.cwd(), 'assets', 'audio', 'temp_vn.opus');
            try {
                execSync(`ffmpeg -y -i "${audioPath}" -c:a libopus -b:a 64k "${tempOpus}"`, { stdio: 'ignore' });
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(tempOpus),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                }, { quoted: getVerifiedQuoted(botConfig) });
                
                if (fs.existsSync(tempOpus)) fs.unlinkSync(tempOpus);
            } catch (ffmpegErr) {
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(audioPath),
                    mimetype: 'audio/mpeg',
                    ptt: true,
                    contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                }, { quoted: getVerifiedQuoted(botConfig) });
            }
        }
    } catch (error) {
        console.error('[Menu] Error on command execution:', error.message);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
