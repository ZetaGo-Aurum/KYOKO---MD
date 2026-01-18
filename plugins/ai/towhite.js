const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'towhite',
    alias: ['white', 'putih'],
    category: 'ai',
    description: 'Transform foto dengan skin tone lebih terang (SDXL)',
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

// Model: SDXL (photorealistic)
const PROMPT = `person with fair white skin tone,
caucasian complexion, same pose, same clothes,
same background, photorealistic, high quality,
natural skin texture, even lighting`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`✨ *ᴛᴏ ᴡʜɪᴛᴇ (sᴅxʟ)*\n\n> Reply atau kirim gambar dengan caption .towhite`)
    }
    
    await m.react('✨')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Menggunakan SDXL...\n> _Mohon bersabar..._`)
    
    try {
        let mediaBuffer
        if (m.isImage && m.download) {
            mediaBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download()
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengunduh gambar`)
        }
        
        // Use SDXL for photorealistic skin transformation
        const result = await nanobanana.generateUniversal(PROMPT)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat memproses gambar'}`)
        }
        
        await m.react('🔥')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `✨ *ᴛᴏ ᴡʜɪᴛᴇ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n> _Model: ${result.model || 'SDXL'}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[towhite] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
