const primbon = require('@bochilteam/scraper-primbon')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'artinama',
    alias: ['namameaning', 'artinamaku'],
    category: 'primbon',
    description: 'Cek arti dari sebuah nama',
    usage: '.artinama <nama>',
    example: '.artinama Budi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
}

let thumbPrimbon = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-games.jpg')
    if (fs.existsSync(thumbPath)) thumbPrimbon = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '🔮 *ᴀʀᴛɪ ɴᴀᴍᴀ*', body = 'Primbon') {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbPrimbon) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbPrimbon,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

async function handler(m, { sock }) {
    const nama = m.args?.join(' ')
    
    if (!nama) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}artinama <nama>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}artinama Budi\``
        )
    }
    
    await m.react('⏳')
    await m.reply(`⏳ *ᴍᴇɴᴄᴀʀɪ ᴀʀᴛɪ ɴᴀᴍᴀ...*`)
    
    try {
        const result = await primbon.artinama(nama)
        
        if (!result || !result.arti) {
            await m.react('❌')
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Arti nama "${nama}" tidak ditemukan`)
        }
        
        const text = `🔮 *ᴀʀᴛɪ ɴᴀᴍᴀ*\n\n` +
            `╭┈┈⬡「 📛 *ɪɴꜰᴏ* 」\n` +
            `┃ 👤 Nama: ${result.nama || nama}\n` +
            `┃ 📝 Arti: ${result.arti}\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        
        await m.react('✅')
        await sock.sendMessage(m.chat, {
            text: text,
            contextInfo: getContextInfo('🔮 *ᴀʀᴛɪ ɴᴀᴍᴀ*', nama)
        }, { quoted: m })
        
    } catch (e) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
