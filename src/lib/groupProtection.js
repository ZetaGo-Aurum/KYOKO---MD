/**
 * Credits & Thanks to
 * Developer = Lucky Archz ( Zann )
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEK
 * 
 * Saluran Resmi Ourin:
 * https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t 
 * 
 */

const { downloadMediaMessage } = require('ourin')
const { isLid, lidToJid } = require('./lidHelper')

const messageCache = new Map()
const CACHE_EXPIRY = 5 * 60 * 1000

function cacheMessage(key, message, content) {
    messageCache.set(key, {
        message,
        content,
        timestamp: Date.now()
    })
    
    if (messageCache.size > 1000) {
        const now = Date.now()
        for (const [k, v] of messageCache) {
            if (now - v.timestamp > CACHE_EXPIRY) {
                messageCache.delete(k)
            }
        }
    }
}

function getCachedMessage(key) {
    const cached = messageCache.get(key)
    if (!cached) return null
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
        messageCache.delete(key)
        return null
    }
    return cached
}

function deleteCachedMessage(key) {
    messageCache.delete(key)
}

const LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*/gi
const WA_LINK_REGEX = /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/gi

async function handleAntilink(m, sock, db) {
    if (!m.isGroup) return false
    
    const group = db.getGroup(m.chat) || {}
    if (group.antilink !== 'on') return false
    
    const text = m.body || ''
    const hasLink = LINK_REGEX.test(text) || WA_LINK_REGEX.test(text)
    
    if (!hasLink) return false
    
    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (m.sender === botNumber) return false
    
    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        
        const senderNumber = m.sender?.replace(/[^0-9]/g, '') || ''
        const botNum = botNumber?.replace(/[^0-9]/g, '') || ''
        
        const senderIsAdmin = groupMeta.participants.some(p => {
            if (!p.admin) return false
            const pJid = p.jid || p.id || ''
            const pLid = p.lid || ''
            const pNumber = pJid.replace(/[^0-9]/g, '')
            const pLidNumber = pLid.replace(/[^0-9]/g, '')
            return pNumber === senderNumber || pLidNumber === senderNumber || 
                   pNumber.includes(senderNumber) || senderNumber.includes(pNumber)
        })
        
        if (senderIsAdmin) return false
        
        const botIsAdmin = groupMeta.participants.some(p => {
            if (!p.admin) return false
            const pJid = p.jid || p.id || ''
            const pNumber = pJid.replace(/[^0-9]/g, '')
            return pNumber === botNum || pNumber.includes(botNum) || botNum.includes(pNumber)
        })
        
        if (!botIsAdmin) {
            await sock.sendMessage(m.chat, {
                text: `⚠️ *ᴀɴᴛɪʟɪɴᴋ*\n\n` +
                    `> Terdeteksi link dari\n` +
                    `> @${m.sender.split('@')[0]}\n\n` +
                    `❌ Bot tidak bisa menghapus pesan\n` +
                    `> karena bot bukan admin grup.\n\n` +
                    `> _Jadikan bot sebagai admin untuk\n` +
                    `> mengaktifkan fitur ini._`,
                mentions: [m.sender]
            })
            return true
        }
        
        await sock.sendMessage(m.chat, { delete: m.key })
        
        const mode = group.antilinkMode || 'remove'
        
        if (mode === 'kick') {
            await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
            await sock.sendMessage(m.chat, {
                text: `⚠️ *ᴀɴᴛɪʟɪɴᴋ*\n\n` +
                    `> @${m.sender.split('@')[0]} dikeluarkan\n` +
                    `> dari grup.\n\n` +
                    `> *Alasan:*\n` +
                    `> Mengirim link tidak diperbolehkan\n` +
                    `> di grup ini.`,
                mentions: [m.sender]
            })
        } else {
            await sock.sendMessage(m.chat, {
                text: `⚠️ *ᴀɴᴛɪʟɪɴᴋ*\n\n` +
                    `> Pesan dari @${m.sender.split('@')[0]}\n` +
                    `> telah dihapus.\n\n` +
                    `> *Alasan:*\n` +
                    `> Mengirim link tidak diperbolehkan\n` +
                    `> di grup ini.`,
                mentions: [m.sender]
            })
        }
        
        return true
    } catch (error) {
        return false
    }
}

async function handleAntiTagSW(rawMsg, sock, db) {
    const key = rawMsg.key
    if (!key?.remoteJid) return false
    
    const chatId = key.remoteJid
    if (!chatId.endsWith('@g.us')) return false
    
    const group = db.getGroup(chatId) || {}
    if (group.antitagsw !== 'on') return false
    
    const msg = rawMsg.message
    if (!msg) return false
    
    const hasStatusTag = msg.groupStatusMentionMessage || 
        msg.statusMentionMessage ||
        msg.groupMentionedMessage
    
    if (!hasStatusTag) return false
    
    const sender = key.participant || key.remoteJid
    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (sender === botNumber) return false
    
    try {
        const groupMeta = await sock.groupMetadata(chatId)
        
        const senderNumber = sender?.replace(/[^0-9]/g, '') || ''
        const botNum = botNumber?.replace(/[^0-9]/g, '') || ''
        
        const senderIsAdmin = groupMeta.participants.some(p => {
            if (!p.admin) return false
            const pJid = p.jid || p.id || ''
            const pLid = p.lid || ''
            const pNumber = pJid.replace(/[^0-9]/g, '')
            const pLidNumber = pLid.replace(/[^0-9]/g, '')
            return pNumber === senderNumber || pLidNumber === senderNumber || 
                   pNumber.includes(senderNumber) || senderNumber.includes(pNumber)
        })
        if (senderIsAdmin) return false
        
        const botIsAdmin = groupMeta.participants.some(p => {
            if (!p.admin) return false
            const pJid = p.jid || p.id || ''
            const pNumber = pJid.replace(/[^0-9]/g, '')
            return pNumber === botNum || pNumber.includes(botNum) || botNum.includes(pNumber)
        })
        if (!botIsAdmin) {
            await sock.sendMessage(chatId, {
                text: `⚠️ *ᴀɴᴛɪᴛᴀɢsᴡ*\n\n` +
                    `> Terdeteksi pesan tag status dari\n` +
                    `> @${sender.split('@')[0]}\n\n` +
                    `> ❌ Bot tidak bisa menghapus pesan\n` +
                    `> karena bot bukan admin grup.\n\n` +
                    `> _Jadikan bot sebagai admin untuk\n` +
                    `> mengaktifkan fitur ini._`,
                mentions: [sender]
            })
            return true
        }
        
        await sock.sendMessage(chatId, { delete: key })
        
        await sock.sendMessage(chatId, {
            text: `📢 *ᴀɴᴛɪᴛᴀɢsᴡ*\n\n` +
                `> Pesan dari @${sender.split('@')[0]}\n` +
                `> telah dihapus.\n\n` +
                `> *Alasan:*\n` +
                `> Mengirim tag status WhatsApp ke grup\n` +
                `> tidak diperbolehkan di grup ini.\n\n` +
                `> _Silakan bagikan status secara langsung\n` +
                `> tanpa tag mentag ke grup._`,
            mentions: [sender]
        })
        
        return true
    } catch (error) {
        return false
    }
}

async function handleAntiViewOnce(rawMsg, sock, db) {
    const key = rawMsg.key
    if (!key?.remoteJid) return false
    
    const chatId = key.remoteJid
    if (!chatId.endsWith('@g.us')) return false
    
    const group = db.getGroup(chatId) || {}
    if (group.antiviewonce !== 'on') return false
    
    const msg = rawMsg.message
    if (!msg) return false
    
    let viewOnce = null
    let innerMsg = null
    
    if (msg.viewOnceMessage?.message) {
        viewOnce = msg.viewOnceMessage
        innerMsg = viewOnce.message
    } else if (msg.viewOnceMessageV2?.message) {
        viewOnce = msg.viewOnceMessageV2
        innerMsg = viewOnce.message
    } else if (msg.viewOnceMessageV2Extension?.message) {
        viewOnce = msg.viewOnceMessageV2Extension
        innerMsg = viewOnce.message
    }
    
    if (!innerMsg) return false
    
    const sender = key.participant || key.remoteJid
    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (sender === botNumber) return false
    
    try {
        let mediaType = null
        let mediaMsg = null
        
        if (innerMsg.imageMessage) {
            mediaType = 'image'
            mediaMsg = innerMsg.imageMessage
        } else if (innerMsg.videoMessage) {
            mediaType = 'video'
            mediaMsg = innerMsg.videoMessage
        } else if (innerMsg.audioMessage) {
            mediaType = 'audio'
            mediaMsg = innerMsg.audioMessage
        }
        
        if (!mediaType || !mediaMsg) return false
        
        const fakeMsg = {
            key: key,
            message: innerMsg
        }
        
        const mediaBuffer = await downloadMediaMessage(fakeMsg, 'buffer', {})
        
        if (!mediaBuffer || mediaBuffer.length < 100) return false
        
        const caption = mediaMsg.caption || ''
        const senderNumber = sender.split('@')[0]
        
        const msgContent = {
            caption: `👁️ *ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ*\n\n` +
                `> Dari: @${senderNumber}\n` +
                (caption ? `> Caption: ${caption}` : ''),
            mentions: [sender]
        }
        
        if (mediaType === 'image') {
            msgContent.image = mediaBuffer
        } else if (mediaType === 'video') {
            msgContent.video = mediaBuffer
        } else if (mediaType === 'audio') {
            msgContent.audio = mediaBuffer
            msgContent.mimetype = 'audio/mpeg'
            delete msgContent.caption
        }
        
        await sock.sendMessage(chatId, msgContent)
        
        return true
    } catch (error) {
        return false
    }
}

async function handleAntiRemove(messageUpdate, sock, db) {
    try {
        const { key, update } = messageUpdate
        
        if (!key?.remoteJid) return false
        
        const chatId = key.remoteJid
        if (!chatId.endsWith('@g.us')) return false
        
        const group = db.getGroup(chatId) || {}
        if (group.antiremove !== 'on') return false
        
        const messageStubType = update?.messageStubType
        
        if (messageStubType === 1 || messageStubType === 68) {
            const deletedMsgId = key.id
            const cached = getCachedMessage(deletedMsgId)
            
            if (!cached) return false
            
            const originalSender = key.participant || key.fromMe ? sock.user?.id : chatId
            const senderNumber = originalSender?.split('@')[0] || 'Unknown'
            
            let responseText = `🗑️ *ᴀɴᴛɪʀᴇᴍᴏᴠᴇ*\n\n` +
                `> Pesan dari @${senderNumber}\n` +
                `> telah dihapus.\n\n` +
                `> *Isi Pesan:*\n`
            
            const content = cached.content
            
            if (typeof content === 'string') {
                responseText += `> ${content}`
                await sock.sendMessage(chatId, {
                    text: responseText,
                    mentions: [originalSender]
                })
            } else if (content.image) {
                await sock.sendMessage(chatId, {
                    image: content.image,
                    caption: responseText + (content.caption || ''),
                    mentions: [originalSender]
                })
            } else if (content.video) {
                await sock.sendMessage(chatId, {
                    video: content.video,
                    caption: responseText + (content.caption || ''),
                    mentions: [originalSender]
                })
            } else if (content.audio) {
                await sock.sendMessage(chatId, {
                    text: responseText + '[Audio Message]',
                    mentions: [originalSender]
                })
            } else if (content.sticker) {
                await sock.sendMessage(chatId, {
                    text: responseText + '[Sticker]',
                    mentions: [originalSender]
                })
            } else if (content.document) {
                await sock.sendMessage(chatId, {
                    text: responseText + `[Document: ${content.fileName || 'file'}]`,
                    mentions: [originalSender]
                })
            }
            
            deleteCachedMessage(deletedMsgId)
            return true
        }
        
        return false
    } catch (error) {
        return false
    }
}

async function cacheMessageForAntiRemove(m, sock, db) {
    if (!m.isGroup) return
    
    const group = db.getGroup(m.chat) || {}
    if (group.antiremove !== 'on') return
    
    const key = m.key?.id
    if (!key) return
    
    let content = null
    
    if (m.body && m.body.trim()) {
        content = m.body
    } else if (m.message?.imageMessage) {
        try {
            const buffer = await downloadMediaMessage(m, 'buffer', {})
            content = {
                image: buffer,
                caption: m.message.imageMessage.caption || ''
            }
        } catch (e) {
            content = { image: null, caption: m.message.imageMessage.caption || '' }
        }
    } else if (m.message?.videoMessage) {
        try {
            const buffer = await downloadMediaMessage(m, 'buffer', {})
            content = {
                video: buffer,
                caption: m.message.videoMessage.caption || ''
            }
        } catch (e) {
            content = { video: null, caption: m.message.videoMessage.caption || '' }
        }
    } else if (m.message?.audioMessage) {
        content = { audio: true }
    } else if (m.message?.stickerMessage) {
        content = { sticker: true }
    } else if (m.message?.documentMessage) {
        content = { 
            document: true, 
            fileName: m.message.documentMessage.fileName 
        }
    } else if (m.message?.extendedTextMessage) {
        content = m.message.extendedTextMessage.text || ''
    } else if (m.message?.conversation) {
        content = m.message.conversation
    }
    
    if (content) {
        cacheMessage(key, m, content)
    }
}

module.exports = {
    handleAntilink,
    handleAntiTagSW,
    handleAntiViewOnce,
    handleAntiRemove,
    cacheMessageForAntiRemove
}
