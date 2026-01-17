const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const path = require('path')
const fs = require('fs')
const { resolveAnyLidToJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'welcome',
    alias: ['wc'],
    category: 'group',
    description: 'Mengatur welcome message untuk grup',
    usage: '.welcome <on/off>',
    example: '.welcome on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

function buildWelcomeMessage(participant, groupName, groupDesc, memberCount, customMsg = null) {
    const emojis = ['🎉', '🎊', '✨', '🌟', '💫', '🎈']
    const greeting = ['Selamat datang', 'Welcome', 'Hai', 'Halo', 'Assalamualaikum'][Math.floor(Math.random() * 5)]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    
    if (customMsg) {
        return customMsg
            .replace(/{user}/gi, `@${participant?.split('@')[0] || 'User'}`)
            .replace(/{group}/gi, groupName || 'Grup')
            .replace(/{desc}/gi, groupDesc || '')
            .replace(/{count}/gi, memberCount?.toString() || '0')
    }
    
    return `╭━━━━━━━━━━━━━━━━━╮\n` +
           `┃ ${emoji} *WELCOME MEMBER* ${emoji}\n` +
           `╰━━━━━━━━━━━━━━━━━╯\n\n` +
           `> ${greeting}, @${participant?.split('@')[0]}! 👋\n` +
           `> Welcome to *${groupName}*\n\n` +
           `╭┈┈⬡「 🏠 *INFO GRUP* 」\n` +
           `┃ ◦ Member: *${memberCount}*\n` +
           `┃ ◦ Desk: ${groupDesc ? groupDesc.slice(0, 50) + (groupDesc.length > 50 ? '...' : '') : '-'}\n` +
           `╰┈┈┈┈┈┈┈┈⬡\n\n` +
           `_Semoga betah ya!_ ✨`
}

async function sendWelcomeMessage(sock, groupJid, participant, groupMeta) {
    try {
        const db = getDatabase()
        const groupData = db.getGroup(groupJid)
        
        if (groupData?.welcome !== true) return false

        const realParticipant = resolveAnyLidToJid(participant, groupMeta?.participants || [])
        const text = buildWelcomeMessage(
            realParticipant,
            groupMeta?.subject,
            groupMeta?.desc,
            groupMeta?.participants?.length,
            groupData?.welcomeMsg
        )
        
        // Simple Profile Picture buffer fetch
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
                title: `Welcome, ${realParticipant?.split('@')[0]}!`,
                body: groupMeta?.subject || 'Grup',
                thumbnail: ppBuffer, // If null, WhatsApp handles it or shows no thumb
                mediaType: 1,
                renderLargerThumbnail: false,
                sourceUrl: config.saluran?.link || ''
            }
        }
        
        // Remove thumbnail if fetch failed to avoid sending corrupt message
        if (!ppBuffer) delete contextInfo.externalAdReply.thumbnail

        await sock.sendMessage(groupJid, { text, contextInfo })
        return true
    } catch (error) {
        console.error('Welcome Error:', error)
        return false
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    
    if (sub === 'on') {
        db.setGroup(m.chat, { welcome: true })
        return m.reply('✅ Welcome message *ON*')
    } 
    if (sub === 'off') {
        db.setGroup(m.chat, { welcome: false })
        return m.reply('❌ Welcome message *OFF*')
    }
    
    // Default info
    const status = db.getGroup(m.chat)?.welcome === true ? 'ON' : 'OFF'
    m.reply(`Status Welcome: *${status}*\nGunakan: \`.welcome on/off\``)
}

module.exports = {
    config: pluginConfig,
    handler,
    sendWelcomeMessage
}
