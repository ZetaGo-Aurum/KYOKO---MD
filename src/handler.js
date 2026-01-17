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
 * JANGAN DIJUAL YA MEK
 */

const config = require('../config');
const { isSelf } = require('../config');
const { serialize } = require('./lib/serialize');
const { getPlugin, getPluginCount, getAllPlugins, pluginStore } = require('./lib/plugins');
const { findSimilarCommands, formatSuggestionMessage } = require('./lib/similarity');
const { getDatabase } = require('./lib/database');
const { formatUptime, createWaitMessage, createErrorMessage } = require('./lib/formatter');
const { getUptime } = require('./connection');
const { logger, logMessage, logCommand, c } = require('./lib/colors');
const { isLid, isLidConverted, lidToJid, convertLidArray, resolveAnyLidToJid, cacheParticipantLids } = require('./lib/lidHelper');
const { hasActiveSession } = require('./lib/gameData');
const { 
    handleAntilink, 
    handleAntiRemove,
    cacheMessageForAntiRemove 
} = require('./lib/groupProtection');
const fs = require("fs")

let checkAfk = null;
let isMuted = null;
let checkSpam = null;
let checkSlowmode = null;
let addXp = null;
let checkLevelUp = null;
let incrementChatCount = null;
let checkStickerCommand = null;

// Antispam delay tracker - users who were detected spamming get 3s delay
const spamDelayTracker = new Map();

try {
    checkAfk = require('../plugins/group/afk').checkAfk;
} catch (e) {}

try {
    isMuted = require('../plugins/group/mute').isMuted;
} catch (e) {}

try {
    checkSpam = require('../plugins/group/antispam').checkSpam;
} catch (e) {}

try {
    checkSlowmode = require('../plugins/group/slowmode').checkSlowmode;
} catch (e) {}

let isToxic = null;
let handleToxicMessage = null;
try {
    const toxicModule = require('../plugins/group/antitoxic');
    isToxic = toxicModule.isToxic;
    handleToxicMessage = toxicModule.handleToxicMessage;
} catch (e) {}

let handleAutoAI = null;
try {
    handleAutoAI = require('./lib/autoaiHandler').handleAutoAI;
} catch (e) {}

try {
    const levelModule = require('../plugins/user/level');
    addXp = levelModule.addXp;
    checkLevelUp = levelModule.checkLevelUp;
} catch (e) {}

try {
    incrementChatCount = require('../plugins/group/totalchat').incrementChatCount;
} catch (e) {}

try {
    checkStickerCommand = require('./lib/stickerCommand').checkStickerCommand;
} catch (e) {}

/**
 * @typedef {Object} HandlerContext
 * @property {Object} sock - Socket connection
 * @property {Object} m - Serialized message
 * @property {Object} config - Bot configuration
 * @property {Object} db - Database instance
 * @property {number} uptime - Bot uptime
 */

/**
 * Anti-spam map untuk tracking pesan per user
 * @type {Map<string, number>}
 */
const spamMap = new Map();

const gamePlugins = [
    'asahotak', 'tebakkata', 'tebakgambar', 'siapakahaku', 
    'tekateki', 'susunkata', 'caklontong', 'family100',
    'tebakbendera', 'tebakkalimat', 'tebaklirik', 'tebaktebakan', 'tebakkimia',
    'tebakdrakor', 'tebakepep', 'tebakjkt48', 'tebakmakanan', 'quizbattle'
];

async function handleGameAnswer(m, sock) {
    try {
        for (const gameName of gamePlugins) {
            try {
                const gamePlugin = require(`../plugins/game/${gameName}`);
                if (gamePlugin.answerHandler) {
                    const handled = await gamePlugin.answerHandler(m, sock);
                    if (handled) return true;
                }
            } catch (e) {
                continue;
            }
        }
    } catch (error) {
        console.error('[GameAnswer] Error:', error.message);
    }
    return false;
}

async function handleSmartTriggers(m, sock, db) {
    if (m.isCommand) return false
    if (!m.body) return false
    if (!config.features?.smartTriggers) return false
    
    try {
        const text = m.body.trim().toLowerCase()
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'KYOKO MD'
        const botName = config.bot?.name || 'KYOKO MD'
        
        const botJid = sock.user?.id
        const isMentioned = m.mentionedJid?.some(jid => 
            jid === botJid || jid?.includes(sock.user?.id?.split(':')[0])
        )
        
        let thumbBuffer = null
        const thumbPath = './assets/images/ourin2.jpg'
        try {
            if (fs.existsSync(thumbPath)) {
                thumbBuffer = fs.readFileSync(thumbPath)
            }
        } catch (e) {}
        
        const contextInfos = {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
        
        if (thumbBuffer) {
            contextInfos.externalAdReply = {
                title: botName,
                body: config.bot?.version ? `v${config.bot.version}` : null,
                thumbnail: thumbBuffer,
                mediaType: 1,
                sourceUrl: config.saluran?.link || 'https://wa.me/6281277777777',
                renderLargerThumbnail: false
            }
        }
        
        if (isMentioned) {
            await sock.sendMessage(m.chat, {
                text: `👋 *ʜᴀɪ!*\n\n` +
                    `> Ada yang manggil ${botName}?\n` +
                    `> Ketik \`.menu\` untuk melihat fitur!\n\n` +
                    `> _${botName} siap membantu! ✨_`,
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }
        
        if (m.isGroup && text?.toLowerCase() === 'p') {
            await sock.sendMessage(m.chat, {
                text: `💬 *ʜᴀɪ @${m.sender.split('@')[0]}!*\n\n` +
                    `> Budayakan salam sebelum\n` +
                    `> memulai percakapan! 🙏\n\n` +
                    `> _Contoh: Assalamualaikum, Halo, dll_`,
                mentions: [m.sender],
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }
        
        if (m.isGroup && (text?.toLowerCase() === 'bot' || text?.toLowerCase().includes('kyoko'))) {
            await sock.sendMessage(m.chat, {
                text: `🤖 *ʙᴏᴛ ᴀᴋᴛɪꜰ*\n\n` +
                    `> ${botName} online dan siap!\n` +
                    `> Ketik \`.menu\` untuk melihat fitur\n\n` +
                    `> _Response time: < 1s ⚡_`,
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }

        if(m.isGroup && text?.toLowerCase()?.includes("assalamualaikum")) {
            await sock.sendMessage(m.chat, {
                text: `Waaalaikumssalam saudaraku`,
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }
    } catch (error) {
        console.error('[SmartTriggers] Error:', error.message)
    }
    
    return false
}

/**
 * Cek apakah user sedang spam
 * @param {string} jid - JID user
 * @returns {boolean} True jika sedang spam
 */
function isSpamming(jid) {
    if (!config.features?.antiSpam) return false;
    
    const now = Date.now();
    const lastMessage = spamMap.get(jid) || 0;
    const interval = config.features?.antiSpamInterval || 3000;
    
    if (now - lastMessage < interval) {
        return true;
    }
    
    spamMap.set(jid, now);
    return false;
}

/**
 * Cek permission untuk menjalankan command
 * @param {Object} m - Serialized message
 * @param {Object} pluginConfig - Konfigurasi plugin
 * @returns {{allowed: boolean, reason: string}} Object dengan status dan alasan
 */
function checkPermission(m, pluginConfig) {
    if (pluginConfig.isOwner && !m.isOwner) {
        return { allowed: false, reason: config.messages?.ownerOnly || '🚫 Owner only!' };
    }
    
    if (pluginConfig.isPremium && !m.isPremium && !m.isOwner) {
        return { allowed: false, reason: config.messages?.premiumOnly || '💎 Premium only!' };
    }
    
    if (pluginConfig.isGroup && !m.isGroup) {
        return { allowed: false, reason: config.messages?.groupOnly || '👥 Group only!' };
    }
    
    if (pluginConfig.isPrivate && m.isGroup) {
        return { allowed: false, reason: config.messages?.privateOnly || '📱 Private chat only!' };
    }
    
    return { allowed: true, reason: '' };
}

/**
 * Cek mode bot dengan validasi kuat
 * @param {Object} m - Serialized message
 * @returns {boolean} True jika boleh diproses
 */
function checkMode(m) {
    const db = getDatabase()
    const realConfig = require('../config')
    const dbMode = db.setting('botMode')
    const mode = dbMode || realConfig.config.mode || 'public'
    if (mode === 'public') {
        return true
    }
    if (mode === 'self') {
        if (m.fromMe) return true
        if (m.isOwner) return true
        if (realConfig.isSelf && realConfig.isSelf(m.sender)) return true
        const senderNumber = m.sender?.replace(/[^0-9]/g, '') || ''
        const botNumber = realConfig.config.bot?.number?.replace(/[^0-9]/g, '') || ''
        if (botNumber && (senderNumber.includes(botNumber) || botNumber.includes(senderNumber))) {
            return true
        }
        const ownerNumbers = realConfig.config.owner?.number || []
        const isOwner = ownerNumbers.some(owner => {
            const cleanOwner = owner.replace(/[^0-9]/g, '')
            return senderNumber.includes(cleanOwner) || cleanOwner.includes(senderNumber)
        })
        
        if (isOwner) return true
        return false
    }
    
    return true
}


/**
 * Handler utama untuk memproses pesan
 * @param {Object} msg - Raw message dari Baileys
 * @param {Object} sock - Socket connection
 * @returns {Promise<void>}
 * @example
 * sock.ev.on('messages.upsert', async ({ messages }) => {
 *   await messageHandler(messages[0], sock);
 * });
 */
async function messageHandler(msg, sock) {
    try {
        const m = await serialize(sock, msg);
        
        if (!m) return;
        if (!m.message) return;
        const db = getDatabase();
        if (!db?.ready) {
            return;
        }
        
        if (!checkMode(m)) {
            return; 
        }
        
        if (m.isBanned) {
            logger.warn('Banned user', m.sender);
            return;
        }
        
        if (config.features?.autoRead) {
            await sock.readMessages([m.key]);
        }
        if (!m.pushName || m.pushName === 'Unknown' || m.pushName.trim() === '') {
            if (!m.isCommand) {
                return;
            }
            m.pushName = m.sender?.split('@')[0] || 'User';
        }
        
        db.setUser(m.sender, {
            name: m.pushName,
            lastSeen: new Date().toISOString()
        });
        
        if (m.isGroup && incrementChatCount) {
            try {
                incrementChatCount(m.chat, m.sender, db)
            } catch (e) {}
        }
        
        if (config.features?.logMessage) {
            const chatType = m.isGroup ? 'group' : 'private';
            logMessage(chatType, m.pushName, m.body);
        }
        
        try {
            const { checkAfk } = require('../plugins/group/afk')
            if (checkAfk) await checkAfk(m, sock)
        } catch (e) {
            if (e.message !== "Cannot find module '../plugins/group/afk'") {
                console.error('[AFK Error]', e.message)
            }
        }
        
        if (m.isGroup) {
            cacheMessageForAntiRemove(m, sock, db)
            
            const antilinkTriggered = await handleAntilink(m, sock, db)
            if (antilinkTriggered) return
            
            if (isMuted && !m.isAdmin) {
                try {
                    if (isMuted(m.chat, m.sender, db)) {
                        await sock.sendMessage(m.chat, { delete: m.key })
                        return
                    }
                } catch (e) {}
            }
            
            if (checkSpam && !m.isAdmin) {
                try {
                    if (checkSpam(m, sock, db)) {
                        const delayKey = `${m.chat}_${m.sender}`
                        spamDelayTracker.set(delayKey, Date.now())
                        
                        const warnPlugin = require('../plugins/group/warn');
                        if (warnPlugin?.handler) {
                            m.text = 'Spam messages'
                            m.quoted = null
                            m.mentionedJid = [m.sender]
                        }
                        await sock.sendMessage(m.chat, {
                            text: `⚠️ @${m.sender.split('@')[0]} terdeteksi spam!\n> Response delay 3 detik diaktifkan.`,
                            mentions: [m.sender]
                        })
                    }
                } catch (e) {}
            }
            
            if (checkSlowmode && !m.isAdmin && !m.isCommand) {
                try {
                    const remaining = checkSlowmode(m, sock, db)
                    if (remaining) {
                        await sock.sendMessage(m.chat, { delete: m.key })
                        return
                    }
                } catch (e) {}
            }
        }
        
        if (addXp && m.body) {
            try {
                const oldXp = db.getUser(m.sender)?.xp || 0
                const newXp = addXp(m.sender, db, 5)
                if (checkLevelUp) {
                    const result = checkLevelUp(oldXp, newXp)
                    if (result.leveled) {
                        await sock.sendMessage(m.chat, {
                            text: `🎉 *ʟᴇᴠᴇʟ ᴜᴘ!*\n\n` +
                                `> @${m.sender.split('@')[0]} naik ke level *${result.newLevel}*!\n` +
                                `> Title: *${result.title}*`,
                            mentions: [m.sender]
                        })
                    }
                }
            } catch (e) {}
        }
        
        if (m.isGroup && isToxic && handleToxicMessage) {
            try {
                const groupData = db.getGroup(m.chat) || {}
                if (groupData.antitoxic && !m.isAdmin && !m.isOwner) {
                    const toxicWords = groupData.toxicWords || []
                    const result = isToxic(m.body, toxicWords)
                    if (result.toxic) {
                        await handleToxicMessage(m, sock, db, result.word)
                        return
                    }
                }
            } catch (e) {}
        }
        
        if (handleAutoAI && m.isGroup) {
            try {
                const aiHandled = await handleAutoAI(m, sock)
                if (aiHandled) return
            } catch (e) {}
        }
        
        if (!m.isCommand) {
            if (checkStickerCommand && m.message?.stickerMessage) {
                try {
                    const stickerCmd = checkStickerCommand(m)
                    if (stickerCmd) {
                        m.isCommand = true
                        m.command = stickerCmd
                        m.prefix = '.'
                        m.text = stickerCmd
                        m.args = []
                    }
                } catch (e) {}
            }
            
            if (!m.isCommand) {
                const smartHandled = await handleSmartTriggers(m, sock, db)
                if (smartHandled) return
                
                if (m.quoted?.id && global.ytdlSessions?.has(m.quoted.id)) {
                    try {
                        const ytmp4Plugin = require('../plugins/download/ytmp4')
                        if (ytmp4Plugin.handleReply) {
                            const handled = await ytmp4Plugin.handleReply(m, { sock })
                            if (handled) return
                        }
                    } catch (e) {}
                }
                
                // Handle hentai confirmation replies (YA/TIDAK without prefix)
                if (m.quoted?.id && global.hentaiPending?.has(m.quoted.id)) {
                    try {
                        const pending = global.hentaiPending.get(m.quoted.id)
                        const text = m.body?.trim()?.toLowerCase()
                        
                        // Check if expired (2 min)
                        if (Date.now() - pending.timestamp > 120000) {
                            global.hentaiPending.delete(m.quoted.id)
                            await m.reply(`⏰ Konfirmasi kadaluarsa. Ulangi command.`)
                            return
                        }
                        
                        // Check if same sender
                        if (pending.sender !== m.sender) {
                            return // Ignore replies from other users
                        }
                        
                        if (text === 'ya' || text === 'y' || text === 'yes' || text === 'iya' || text === 'ok') {
                            global.hentaiPending.delete(m.quoted.id)
                            await m.reply(`⏳ _Mengambil gambar ${pending.category}..._`)
                            
                            const hentaiPlugin = require('../plugins/anime/hentai')
                            if (hentaiPlugin.sendNSFWImage) {
                                await hentaiPlugin.sendNSFWImage(m, sock, pending.category)
                            }
                            return
                        } else if (text === 'tidak' || text === 'no' || text === 'n' || text === 'batal' || text === 'cancel' || text === 'ga' || text === 'gak' || text === 'nope') {
                            global.hentaiPending.delete(m.quoted.id)
                            await m.reply(`✅ Dibatalkan. Konten NSFW tidak ditampilkan.`)
                            return
                        }
                    } catch (e) {
                        console.error('[Hentai Reply] Error:', e.message)
                    }
                }
                
                try {
                    const tttPlugin = require('../plugins/game/tictactoe')
                    if (tttPlugin.answerHandler) {
                        const handled = await tttPlugin.answerHandler(m, sock)
                        if (handled) return
                    }
                } catch (e) {}
                
                try {
                    const suitPlugin = require('../plugins/game/suitpvp')
                    if (suitPlugin.answerHandler) {
                        const handled = await suitPlugin.answerHandler(m, sock)
                        if (handled) return
                    }
                } catch (e) {}
                
                try {
                    const utPlugin = require('../plugins/game/ulartangga')
                    if (utPlugin.answerHandler) {
                        const handled = await utPlugin.answerHandler(m, sock)
                        if (handled) return
                    }
                } catch (e) {}
                
                if (hasActiveSession(m.chat)) {
                    await handleGameAnswer(m, sock);
                }
                return;
            }
        }
        
        const delayKey = `${m.chat}_${m.sender}`
        const lastSpamDetect = spamDelayTracker.get(delayKey)
        if (lastSpamDetect) {
            const elapsed = Date.now() - lastSpamDetect
            if (elapsed < 60000) {
                await new Promise(r => setTimeout(r, 3000))
            } else {
                spamDelayTracker.delete(delayKey)
            }
        }
        
        if (isSpamming(m.sender)) {
            return;
        }
        
        const plugin = getPlugin(m.command);
        
        if (!plugin) {
            const allCommands = []
            const plugins = getAllPlugins()
            
            for (const p of plugins) {
                if (p.config.isEnabled) {
                    allCommands.push(p.config.name)
                    if (p.config.alias && Array.isArray(p.config.alias)) {
                        allCommands.push(...p.config.alias)
                    }
                }
            }
            
            const suggestions = findSimilarCommands(m.command, allCommands, {
                maxResults: 3,
                minSimilarity: 0.35,
                maxDistance: 4
            })
            
            if (suggestions.length > 0) {
                const message = formatSuggestionMessage(m.command, suggestions, m.prefix)
                await m.reply(message)
            }
            
            return;
        }
        
        if (!plugin.config.isEnabled) {
            return;
        }
        
        if (m.isGroup) {
            const groupData = db.getGroup(m.chat) || {}
            const botMode = groupData.botMode || 'md'
            const pluginCategory = plugin.config.category
            
            if (botMode === 'cpanel' && pluginCategory !== 'panel' && pluginCategory !== 'owner' && pluginCategory !== 'main' && pluginCategory !== 'group' && m.command !== 'botmode') {
                return
            }
            if (botMode === 'md' && pluginCategory === 'panel') {
                return
            }
        }
        
        const permission = checkPermission(m, plugin.config);
        if (!permission.allowed) {
            await m.reply(permission.reason);
            return;
        }
        
        const user = db.getUser(m.sender);
        
        if (!m.isOwner && plugin.config.cooldown > 0) {
            const cooldownRemaining = db.checkCooldown(m.sender, m.command, plugin.config.cooldown);
            if (cooldownRemaining) {
                const cooldownMsg = (config.messages?.cooldown || '⏱️ Tunggu %time% detik')
                    .replace('%time%', cooldownRemaining);
                await m.reply(cooldownMsg);
                return;
            }
        }
        
        if (!m.isOwner && !m.isPremium && plugin.config.limit > 0) {
            const currentLimit = user?.limit || 0;
            if (currentLimit < plugin.config.limit) {
                await m.reply(config.messages?.limitExceeded || '📊 Limit habis!');
                return;
            }
            db.updateLimit(m.sender, -plugin.config.limit);
        }
        
        if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate('composing', m.chat);
        }
        
        const context = {
            sock,
            m,
            config,
            db,
            uptime: getUptime(),
            plugins: {
                count: getPluginCount()
            }
        };
        
        // Log command execution with box style
        const chatType = m.isGroup ? 'group' : 'private';
        logCommand(`${m.prefix}${m.command}`, m.pushName, chatType);
        
        await plugin.handler(m, context);
        
        if (!m.isOwner && plugin.config.cooldown > 0) {
            db.setCooldown(m.sender, m.command, plugin.config.cooldown);
        }
        
        db.incrementStat('commandsExecuted');
        db.incrementStat(`command_${m.command}`);
        
        if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate('paused', m.chat);
        }
        
    } catch (error) {
        logger.error('Handler', error.message);
        
        try {
            const m = await serialize(sock, msg);
            if (m) {
                await m.reply(createErrorMessage('Terjadi kesalahan saat memproses command!'));
            }
        } catch {
            logger.error('Failed to send error message');
        }
    }
}

/**
 * Handler untuk update group participants
 * @param {Object} update - Update data
 * @param {Object} sock - Socket connection
 * @returns {Promise<void>}
 */
async function groupHandler(update, sock) {
    try {
        if (global.sewaLeaving) return
        
        const { id: groupJid, participants, action } = update
        
        const db = getDatabase()
        
        let groupData = db.getGroup(groupJid)
        if (!groupData) {
            db.setGroup(groupJid, {
                welcome: config.welcome?.defaultEnabled ?? true,
                goodbye: config.goodbye?.defaultEnabled ?? true,
                leave: config.goodbye?.defaultEnabled ?? true
            })
            groupData = db.getGroup(groupJid)
        }
        
        const groupMeta = await sock.groupMetadata(groupJid)
        
        let sendWelcomeMessage, sendGoodbyeMessage
        try {
            sendWelcomeMessage = require('../plugins/group/welcome').sendWelcomeMessage
            sendGoodbyeMessage = require('../plugins/group/goodbye').sendGoodbyeMessage
        } catch (e) {}
        
        for (let participant of participants) {
            if (isLid(participant) || isLidConverted(participant)) {
                const found = groupMeta.participants?.find(p => 
                    p.id === participant || p.lid === participant ||
                    p.lid === participant.replace('@s.whatsapp.net', '@lid')
                );
                if (found) {
                    participant = (found.jid && !found.jid.endsWith('@lid') && !isLidConverted(found.jid)) 
                                  ? found.jid 
                                  : (found.id && !found.id.endsWith('@lid') && !isLidConverted(found.id))
                                    ? found.id
                                    : lidToJid(participant);
                } else {
                    participant = lidToJid(participant);
                }
            }
            
            if (action === 'add' && sendWelcomeMessage) {
                await sendWelcomeMessage(sock, groupJid, participant, groupMeta)
            }
            
            if (action === 'remove' && sendGoodbyeMessage) {
                await sendGoodbyeMessage(sock, groupJid, participant, groupMeta)
            }
            
            const saluranId = config.saluran?.id || '120363208449943317@newsletter'
            const saluranName = config.saluran?.name || config.bot?.name || 'KYOKO MD'
            
            let groupPpUrl = 'https://files.catbox.moe/w4e75f.jpg'
            try {
                groupPpUrl = await sock.profilePictureUrl(groupJid, 'image') || groupPpUrl
            } catch (e) {}
            
            if (action === 'promote') {
                await sock.sendMessage(groupJid, {
                    text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                        `┃  👑 *ᴘʀᴏᴍᴏᴛᴇ*\n` +
                        `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                        `> @${participant.split('@')[0]} sekarang\n` +
                        `> menjadi *Admin* grup!\n\n` +
                        `> _Selamat atas jabatan barunya! 🎉_`,
                    mentions: [participant],
                    contextInfo: {
                        mentionedJid: [participant],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: saluranId,
                            newsletterName: saluranName,
                            serverMessageId: 127
                        },
                        externalAdReply: {
                            showAdAttribution: false,
                            title: '👑 PROMOTE',
                            body: `${participant.split('@')[0]} menjadi Admin`,
                            thumbnailUrl: groupPpUrl,
                            mediaType: 1,
                            renderLargerThumbnail: false,
                            sourceUrl: ''
                        }
                    }
                })
            }
            
            if (action === 'demote') {
                await sock.sendMessage(groupJid, {
                    text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                        `┃  📉 *ᴅᴇᴍᴏᴛᴇ*\n` +
                        `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                        `> @${participant.split('@')[0]} bukan\n` +
                        `> *Admin* lagi.\n\n` +
                        `> _Terima kasih atas kontribusinya! 🙏_`,
                    mentions: [participant],
                    contextInfo: {
                        mentionedJid: [participant],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: saluranId,
                            newsletterName: saluranName,
                            serverMessageId: 127
                        },
                        externalAdReply: {
                            showAdAttribution: false,
                            title: '📉 DEMOTE',
                            body: `${participant.split('@')[0]} bukan Admin lagi`,
                            thumbnailUrl: groupPpUrl,
                            mediaType: 1,
                            renderLargerThumbnail: false,
                            sourceUrl: ''
                        }
                    }
                })
            }
        }
        
    } catch (error) {
        console.error('[GroupHandler] Error:', error.message)
    }
}

async function messageUpdateHandler(updates, sock) {
    const db = getDatabase()
    
    for (const update of updates) {
        try {
            await handleAntiRemove(update, sock, db)
        } catch (error) {
            continue
        }
    }
}

/**
 * Cache untuk menyimpan state terakhir grup
 * Format: { groupId: { announce: boolean, restrict: boolean, lastUpdate: timestamp } }
 */
const groupSettingsCache = new Map()

/**
 * Debounce cooldown untuk mencegah spam (dalam ms)
 */
const GROUP_SETTINGS_COOLDOWN = 5000

async function groupSettingsHandler(update, sock) {
    try {
        if (global.sewaLeaving) return
        if (global.isFetchingGroups) return
        
        const groupId = update.id
        if (!groupId || !groupId.endsWith('@g.us')) return
        
        console.log('[GroupSettings] Event received:', JSON.stringify({ id: groupId, announce: update.announce, restrict: update.restrict }))
        
        if (update.announce === undefined && update.restrict === undefined) {
            return
        }
        
        const cached = groupSettingsCache.get(groupId) || {}
        const now = Date.now()
        
        if (cached.lastUpdate && (now - cached.lastUpdate) < GROUP_SETTINGS_COOLDOWN) {
            console.log('[GroupSettings] Cooldown active, skipping')
            return
        }
        
        let hasRealChange = false
        
        if (update.announce !== undefined) {
            if (cached.announce === undefined) {
                try {
                    const meta = await sock.groupMetadata(groupId)
                    cached.announce = meta.announce || false
                } catch {
                    cached.announce = false
                }
            }
            if (cached.announce !== update.announce) {
                hasRealChange = true
                
                const saluranId = config.saluran?.id || '120363208449943317@newsletter'
                const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
                
                if (update.announce === true) {
                    await sock.sendMessage(groupId, {
                        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  🔒 *ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ*\n` +
                            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                            `> Grup sekarang *ditutup*.\n` +
                            `> Hanya admin yang bisa\n` +
                            `> mengirim pesan.\n\n` +
                            `> _Admin dapat membuka dengan_\n` +
                            `> _\`.group open\`_`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    })
                } else {
                    await sock.sendMessage(groupId, {
                        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  🔓 *ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ*\n` +
                            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                            `> Grup sekarang *dibuka*.\n` +
                            `> Semua member bisa\n` +
                            `> mengirim pesan.\n\n` +
                            `> _Selamat berkirim pesan! 💬_`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    })
                }
                
                cached.announce = update.announce
            }
        }
        
        if (update.restrict !== undefined) {
            if (cached.restrict === undefined) {
                try {
                    const meta = await sock.groupMetadata(groupId)
                    cached.restrict = meta.restrict || false
                } catch {
                    cached.restrict = false
                }
            }
            if (cached.restrict !== update.restrict) {
                hasRealChange = true
                const saluranIdR = config.saluran?.id || '120363208449943317@newsletter'
                const saluranNameR = config.saluran?.name || config.bot?.name || 'Ourin-AI'
                
                if (update.restrict === true) {
                    await sock.sendMessage(groupId, {
                        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  ⚙️ *ɪɴꜰᴏ ɢʀᴜᴘ*\n` +
                            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                            `> Info grup sekarang *terbatas*.\n` +
                            `> Hanya admin yang bisa\n` +
                            `> edit info grup.`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranIdR,
                                newsletterName: saluranNameR,
                                serverMessageId: 127
                            }
                        }
                    })
                } else {
                    await sock.sendMessage(groupId, {
                        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  ⚙️ *ɪɴꜰᴏ ɢʀᴜᴘ*\n` +
                            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                            `> Info grup sekarang *terbuka*.\n` +
                            `> Semua member bisa\n` +
                            `> edit info grup.`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranIdR,
                                newsletterName: saluranNameR,
                                serverMessageId: 127
                            }
                        }
                    })
                }
                cached.restrict = update.restrict
            }
        }
        if (hasRealChange) {
            cached.lastUpdate = now
            groupSettingsCache.set(groupId, cached)
        }
        
    } catch (error) {
        console.error('[GroupSettings] Error:', error.message)
    }
}

module.exports = {
    messageHandler,
    groupHandler,
    messageUpdateHandler,
    groupSettingsHandler,
    checkPermission,
    checkMode,
    isSpamming
};
