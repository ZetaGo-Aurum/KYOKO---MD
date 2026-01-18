const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'tohijab',
    alias: ['hijab'],
    category: 'ai',
    description: 'Transform foto menjadi berhijab (SDXL)',
    usage: '.tohijab',
    example: '.tohijab',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

// Model: SDXL (photorealistic)
const PROMPT = `beautiful woman wearing neat modest hijab,
hijab covering hair and neck completely,
realistic face, soft lighting,
photorealistic, natural skin texture, high detail,
elegant muslim fashion`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🧕 *ᴛᴏ ʜɪᴊᴀʙ (sᴅxʟ)*\n\n> Reply atau kirim gambar dengan caption .tohijab`)
    }
    
    await m.react('🧕')
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
        
        // Use SDXL for photorealistic hijab transformation
        const result = await nanobanana.generateUniversal(PROMPT)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat memproses gambar'}`)
        }
        
        await m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🧕 *ᴛᴏ ʜɪᴊᴀʙ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n> _Model: ${result.model || 'SDXL'}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[tohijab] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
