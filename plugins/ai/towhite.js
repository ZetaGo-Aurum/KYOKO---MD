const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'towhite',
    alias: ['white', 'putih'],
    category: 'ai',
    description: 'Transform foto dengan skin tone lebih terang',
    usage: '.towhite',
    example: '.towhite',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

const PROMPT = `natural lighter skin tone,
same identity, realistic face,
even skin color, soft lighting,
photorealistic, no overexposure`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`✨ *ᴛᴏ ᴡʜɪᴛᴇ*\n\n> Reply atau kirim gambar dengan caption .towhite`)
    }
    
    m.react('✨')
    
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
        
        const result = await nanoBanana(mediaBuffer, PROMPT)
        
        if (!result?.imageUrl) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat memproses gambar`)
        }
        
        m.react('🔥')
        
        await sock.sendMessage(m.chat, {
            image: { url: result.imageUrl },
            caption: `✨ *ᴛᴏ ᴡʜɪᴛᴇ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ`
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
