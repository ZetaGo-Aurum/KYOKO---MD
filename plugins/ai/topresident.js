const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'topresident',
    alias: ['president', 'presiden'],
    category: 'ai',
    description: 'Transform foto menjadi presiden Indonesia (SDXL)',
    usage: '.topresident',
    example: '.topresident',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

// Model: SDXL (photorealistic)
const PROMPT = `realistic portrait as Indonesian president,
formal presidential suit black with red tie,
authoritative dignified expression,
studio lighting, photorealistic,
official presidential portrait style, high detail`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🇮🇩 *ᴛᴏ ᴘʀᴇsɪᴅᴇɴᴛ (sᴅxʟ)*\n\n> Reply atau kirim gambar dengan caption .topresident`)
    }
    
    await m.react('🇮🇩')
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
        
        // Use SDXL for photorealistic presidential portrait
        const result = await nanobanana.generateUniversal(PROMPT)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat memproses gambar'}`)
        }
        
        await m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🇮🇩 *ᴛᴏ ᴘʀᴇsɪᴅᴇɴᴛ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n> _Model: ${result.model || 'SDXL'}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[topresident] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
