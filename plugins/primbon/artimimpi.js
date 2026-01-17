const primbon = require('@bochilteam/scraper-primbon')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'artimimpi',
    alias: ['tafsirmimpi', 'mimpi'],
    category: 'primbon',
    description: 'Cek arti dari sebuah mimpi',
    usage: '.artimimpi <kata kunci>',
    example: '.artimimpi ular',
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

function getContextInfo(title = '🌙 *ᴀʀᴛɪ ᴍɪᴍᴘɪ*', body = 'Primbon') {
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
    const kata = m.args?.join(' ')
    
    if (!kata) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}artimimpi <kata kunci>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}artimimpi ular\`\n` +
            `> \`${m.prefix}artimimpi jatuh\``
        )
    }
    
    await m.react('⏳')
    await m.reply(`⏳ *ᴍᴇɴᴄᴀʀɪ ᴀʀᴛɪ ᴍɪᴍᴘɪ...*`)
    
    try {
        const result = await primbon.artimimpi(kata)
        
        if (!result || result.length === 0) {
            await m.react('❌')
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Arti mimpi "${kata}" tidak ditemukan`)
        }
        
        let text = `🌙 *ᴀʀᴛɪ ᴍɪᴍᴘɪ*\n\n`
        text += `> Kata kunci: \`${kata}\`\n\n`
        
        const results = Array.isArray(result) ? result.slice(0, 5) : [result]
        
        results.forEach((item, i) => {
            text += `╭┈┈⬡「 ${i + 1}. *${item.mimpiTentang || item.title || 'Mimpi'}* 」\n`
            text += `┃ 📖 ${item.arti || item.description || JSON.stringify(item)}\n`
            text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        })
        
        await m.react('✅')
        await sock.sendMessage(m.chat, {
            text: text,
            contextInfo: getContextInfo('🌙 *ᴀʀᴛɪ ᴍɪᴍᴘɪ*', kata)
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
