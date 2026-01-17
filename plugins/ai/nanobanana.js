const nanoBanana = require('../../src/scraper/nanobanana')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'nanobanana',
    alias: ['imgedit', 'editimg'],
    category: 'ai',
    description: 'Edit gambar dengan AI menggunakan prompt',
    usage: '.nanobanana <prompt>',
    example: '.nanobanana make it anime style',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ')
    if (!prompt) {
        return m.reply(`🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n> Edit gambar dengan AI\n\n\`Contoh: ${m.prefix}nanobanana make it anime style\`\n\n> Reply atau kirim gambar dengan caption`)
    }
    
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n> Reply atau kirim gambar dengan caption`)
    }
    
    m.react('🍌')
    
    try {
        let mediaBuffer
        if (m.isImage && m.download) {
            mediaBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download()
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengunduh gambar`)
        }
        
        const result = await nanoBanana(mediaBuffer, prompt)
        
        if (!result?.imageUrl) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat mengedit gambar`)
        }
        
        m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: { url: result.imageUrl },
            caption: `🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ᴘʀᴏᴍᴘᴛ: \`${prompt}\`\n` +
                `┃ 🤖 ᴍᴏᴅᴇʟ: \`${result.model}\`\n` +
                `┃ 🎭 sᴛʏʟᴇ: \`${result.styleId}\`\n` +
                `╰┈┈⬡`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
