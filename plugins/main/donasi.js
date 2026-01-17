const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'donasi',
    alias: ['donate', 'donation', 'support', 'saweria', 'trakteer'],
    category: 'main',
    description: 'Informasi donasi untuk mendukung bot',
    usage: '.donasi',
    example: '.donasi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const botName = config.bot?.name || 'Ourin-AI'
    const ownerName = config.owner?.name || 'Owner'
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || botName
    
    let text = `╭━━━━━━━━━━━━━━━━━╮\n`
    text += `┃  💝 *ᴅᴏɴᴀsɪ*\n`
    text += `╰━━━━━━━━━━━━━━━━━╯\n\n`
    
    text += `> Terima kasih telah menggunakan\n`
    text += `> *${botName}*! 🙏\n\n`
    
    text += `╭┈┈⬡「 💳 *ᴘᴀʏᴍᴇɴᴛ* 」\n`
    text += `┃\n`
    text += `┃ 🏦 *ᴅᴀɴᴀ*\n`
    text += `┃ ◦ 0838-xxxx-xxxx\n`
    text += `┃\n`
    text += `┃ 🏦 *ɢᴏᴘᴀʏ*\n`
    text += `┃ ◦ 0838-xxxx-xxxx\n`
    text += `┃\n`
    text += `┃ 🏦 *ᴏᴠᴏ*\n`
    text += `┃ ◦ 0838-xxxx-xxxx\n`
    text += `┃\n`
    text += `┃ ☕ *sᴀᴡᴇʀɪᴀ*\n`
    text += `┃ ◦ saweria.co/username\n`
    text += `┃\n`
    text += `┃ 🍵 *ᴛʀᴀᴋᴛᴇᴇʀ*\n`
    text += `┃ ◦ trakteer.id/username\n`
    text += `┃\n`
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    text += `╭┈┈⬡「 🎁 *ʙᴇɴᴇꜰɪᴛ* 」\n`
    text += `┃ ◦ Mendukung development\n`
    text += `┃ ◦ Server lebih stabil\n`
    text += `┃ ◦ Fitur baru lebih cepat\n`
    text += `┃ ◦ Priority support\n`
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    text += `> _Donasi berapapun sangat berharga_\n`
    text += `> Contact: @${config.owner?.number?.[0] || 'owner'}`
    
    let thumbBuffer = null
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg')
    const fallbackPath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg')
    
    if (fs.existsSync(thumbPath)) {
        thumbBuffer = fs.readFileSync(thumbPath)
    } else if (fs.existsSync(fallbackPath)) {
        thumbBuffer = fs.readFileSync(fallbackPath)
    }
    
    const contextInfo = {
        mentionedJid: config.owner?.number?.[0] ? [`${config.owner.number[0]}@s.whatsapp.net`] : [],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: `💝 Donasi ${botName}`,
            body: 'Dukung pengembangan bot ini!',
            sourceUrl: config.saluran?.link || '',
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: false
        }
    }
    
    if (thumbBuffer) {
        contextInfo.externalAdReply.thumbnail = thumbBuffer
    }
    
    await sock.sendMessage(m.chat, {
        text: text,
        contextInfo: contextInfo
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
