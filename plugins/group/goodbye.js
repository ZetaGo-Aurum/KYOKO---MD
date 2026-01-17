const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const path = require('path')
const fs = require('fs')
const { resolveAnyLidToJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'goodbye',
    alias: ['bye', 'leave'],
    category: 'group',
    description: 'Mengatur goodbye message untuk grup',
    usage: '.goodbye <on/off>',
    example: '.goodbye on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

function buildGoodbyeMessage(participant, groupName, memberCount, customMsg = null) {
    const emojis = ['👋', '😢', '💔', '🚪']
    const farewell = ['Goodbye', 'Selamat tinggal', 'Sayonara', 'See you', 'Dadah'][Math.floor(Math.random() * 5)]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    
    if (customMsg) {
        return customMsg
            .replace(/{user}/gi, `@${participant?.split('@')[0] || 'User'}`)
            .replace(/{group}/gi, groupName || 'Grup')
            .replace(/{count}/gi, memberCount?.toString() || '0')
    }
    
    return `╭━━━━━━━━━━━━━━━━━╮\n` +
           `┃ ${emoji} *GOODBYE MEMBER* ${emoji}\n` +
           `╰━━━━━━━━━━━━━━━━━╯\n\n` +
           `> ${farewell}, @${participant?.split('@')[0]}! 👋\n` +
           `> Leaving *${groupName}*\n\n` +
           `╭┈┈⬡「 🏠 *INFO GRUP* 」\n` +
           `┃ ◦ Sisa Member: *${memberCount}*\n` +
           `╰┈┈┈┈┈┈┈┈⬡\n\n` +
           `_Semoga sukses selalu!_ ✨`
}

async function sendGoodbyeMessage(sock, groupJid, participant, groupMeta) {
    try {
        const db = getDatabase()
        const groupData = db.getGroup(groupJid)
        
        if (groupData?.goodbye !== true && groupData?.leave !== true) return false

        const realParticipant = resolveAnyLidToJid(participant, groupMeta?.participants || [])
        const text = buildGoodbyeMessage(
            realParticipant,
            groupMeta?.subject,
            groupMeta?.participants?.length,
            groupData?.goodbyeMsg
        )
        
        let ppBuffer = null
        try {
            const ppUrl = await sock.profilePictureUrl(realParticipant, 'image')
            if (ppUrl) {
                const axios = require('axios')
                const res = await axios.get(ppUrl, { responseType: 'arraybuffer' })
                ppBuffer = res.data
            }
        } catch (e) {
            try {
                const thumbPath = path.join(process.cwd(), 'assets', 'images', 'pp-kosong.jpg')
                if (fs.existsSync(thumbPath)) ppBuffer = fs.readFileSync(thumbPath)
            } catch {}
        }

        const contextInfo = {
            mentionedJid: [realParticipant],
            externalAdReply: {
                title: `Goodbye, ${realParticipant?.split('@')[0]}!`,
                body: groupMeta?.subject || 'Grup',
                thumbnail: ppBuffer,
                mediaType: 1,
                renderLargerThumbnail: false,
                sourceUrl: config.saluran?.link || ''
            }
        }
        
        if (!ppBuffer) delete contextInfo.externalAdReply.thumbnail

        await sock.sendMessage(groupJid, { text, contextInfo })
        return true
    } catch (error) {
        console.error('Goodbye Error:', error)
        return false
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    
    if (sub === 'on') {
        db.setGroup(m.chat, { goodbye: true, leave: true })
        return m.reply('✅ Goodbye message *ON*')
    } 
    if (sub === 'off') {
        db.setGroup(m.chat, { goodbye: false, leave: false })
        return m.reply('❌ Goodbye message *OFF*')
    }
    
    const status = (db.getGroup(m.chat)?.goodbye === true) ? 'ON' : 'OFF'
    m.reply(`Status Goodbye: *${status}*\nGunakan: \`.goodbye on/off\``)
}

module.exports = {
    config: pluginConfig,
    handler,
    sendGoodbyeMessage
}
