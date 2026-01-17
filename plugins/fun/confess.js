const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'confess',
    alias: ['confession', 'anon', 'anonymous', 'menfess'],
    category: 'fun',
    description: 'Kirim pesan anonim ke grup',
    usage: '.confess <pesan>',
    example: '.confess Aku suka seseorang di grup ini',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 60,
    limit: 1,
    isEnabled: true
}

if (!global.confessions) global.confessions = {}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user) {
        return m.reply(`❌ User tidak ditemukan!`)
    }
    
    const message = m.fullArgs?.trim() || m.text?.trim()
    
    if (!message) {
        return m.reply(
            `💌 *ᴀɴᴏɴʏᴍᴏᴜs ᴄᴏɴғᴇss*\n\n` +
            `> Kirim pesan anonim ke grup!\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ 1. Chat bot secara private\n` +
            `┃ 2. Ketik: .confess [pesan]\n` +
            `┃ 3. Pilih grup tujuan\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `*Contoh:*\n` +
            `> .confess Aku suka seseorang di grup ini 😳`
        )
    }
    
    if (message.length < 10) {
        return m.reply(`❌ Pesan terlalu pendek! Minimal 10 karakter.`)
    }
    
    if (message.length > 1000) {
        return m.reply(`❌ Pesan terlalu panjang! Maksimal 1000 karakter.`)
    }
    
    const groups = await sock.groupFetchAllParticipating()
    const groupList = Object.entries(groups)
        .filter(([id, meta]) => meta.participants?.some(p => p.id === m.sender))
        .map(([id, meta]) => ({ id, name: meta.subject }))
    
    if (groupList.length === 0) {
        return m.reply(`❌ Kamu tidak tergabung di grup manapun dengan bot!`)
    }
    
    const confessionId = `conf_${Date.now()}`
    
    global.confessions[m.sender] = {
        id: confessionId,
        message: message,
        groups: groupList,
        createdAt: Date.now()
    }
    
    let text = `💌 *ᴘɪʟɪʜ ɢʀᴜᴘ ᴛᴜᴊᴜᴀɴ*\n\n`
    text += `╭┈┈⬡「 📋 *ɢʀᴜᴘ* 」\n`
    
    groupList.forEach((g, i) => {
        text += `┃ ${i + 1}. ${g.name}\n`
    })
    
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    text += `> Reply dengan nomor grup\n`
    text += `> Contoh: *1*`
    
    await m.reply(text)
}

async function replyHandler(m, { sock }) {
    if (m.isGroup) return false
    
    const confession = global.confessions[m.sender]
    if (!confession) return false
    
    const num = parseInt(m.body?.trim())
    if (isNaN(num) || num < 1 || num > confession.groups.length) {
        return false
    }
    
    const targetGroup = confession.groups[num - 1]
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    try {
        await sock.sendMessage(targetGroup.id, {
            text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                `┃  💌 *ᴀɴᴏɴʏᴍᴏᴜs ᴄᴏɴғᴇss*\n` +
                `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                `${confession.message}\n\n` +
                `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n` +
                `┃ 🔒 Pengirim: *Anonim*\n` +
                `┃ ⏰ Waktu: *${new Date().toLocaleTimeString('id-ID')}*\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> _Kirim confession: chat bot secara private_\n` +
                `> _Ketik: .confess [pesan]_`,
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
        
        await m.reply(
            `✅ *ᴄᴏɴғᴇssɪᴏɴ ᴛᴇʀᴋɪʀɪᴍ!*\n\n` +
            `> Pesan dikirim ke:\n` +
            `> *${targetGroup.name}*\n\n` +
            `> Identitasmu terjaga aman! 🔒`
        )
        
        delete global.confessions[m.sender]
        return true
        
    } catch (error) {
        await m.reply(`❌ Gagal mengirim confession: ${error.message}`)
        return true
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    replyHandler
}
