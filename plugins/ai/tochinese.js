const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'tochinese',
    alias: ['chinese', 'china'],
    category: 'ai',
    description: 'Transform foto menjadi chinese art style (MeinaMix)',
    usage: '.tochinese',
    example: '.tochinese',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

// Model: MeinaMix (semi-realistic asian style)
const PROMPT = `chinese illustration style,
soft elegant facial features,
smooth porcelain-like skin,
cinematic lighting, high detail,
asian art style portrait, beautiful`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🏮 *ᴛᴏ ᴄʜɪɴᴇsᴇ (ᴍᴇɪɴᴀᴍɪx)*\n\n> Reply atau kirim gambar dengan caption .tochinese`)
    }
    
    await m.react('🏮')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Menggunakan MeinaMix...\n> _Mohon bersabar..._`)
    
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
        
        // Use MeinaMix for chinese/asian art style
        const result = await nanobanana.generateMeina(PROMPT)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat memproses gambar'}`)
        }
        
        await m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🏮 *ᴛᴏ ᴄʜɪɴᴇsᴇ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n> _Model: ${result.model || 'MeinaMix'}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[tochinese] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
