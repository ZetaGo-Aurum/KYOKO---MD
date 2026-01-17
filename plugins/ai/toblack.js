const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Transform foto dengan skin tone lebih gelap',
    usage: '.toblack',
    example: '.toblack',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

const PROMPT = `natural darker skin tone,
same identity, realistic face,
rich skin texture, soft lighting,
photorealistic, balanced exposure`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n> Reply atau kirim gambar dengan caption .toblack`)
    }
    
    m.react('🖤')
    
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
            caption: `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ`
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
