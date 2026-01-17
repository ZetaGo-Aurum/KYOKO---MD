const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'tomanga',
    alias: ['manga'],
    category: 'ai',
    description: 'Transform foto menjadi manga style',
    usage: '.tomanga',
    example: '.tomanga',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

const PROMPT = `black and white manga style,
same identity, accurate facial proportions,
clean ink lineart, screentone shading,
high contrast, japanese manga panel look`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`📖 *ᴛᴏ ᴍᴀɴɢᴀ*\n\n> Reply atau kirim gambar dengan caption .tomanga`)
    }
    
    m.react('📖')
    
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
        
        m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: { url: result.imageUrl },
            caption: `📖 *ᴛᴏ ᴍᴀɴɢᴀ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ`
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
