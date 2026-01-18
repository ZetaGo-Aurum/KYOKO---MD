const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'toanime',
    alias: ['anime'],
    category: 'ai',
    description: 'Transform foto menjadi anime style (TRUE Img2Img)',
    usage: '.toanime',
    example: '.toanime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🎌 *ᴛᴏ ᴀɴɪᴍᴇ*\n\n> Reply atau kirim gambar dengan caption .toanime\n> _Pose dan komposisi akan dipertahankan!_`)
    }
    
    await m.react('🎌')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Menggunakan TRUE Img2Img...\n> _Pose asli akan dipertahankan..._`)
    
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
        
        const result = await nanobanana.toAnime(mediaBuffer)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat memproses gambar'}`)
        }
        
        await m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🎌 *ᴛᴏ ᴀɴɪᴍᴇ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n> _Model: ${result.model}_\n> _TRUE Img2Img_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[toanime] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
