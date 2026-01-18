const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'toanime',
    alias: ['anime'],
    category: 'ai',
    description: 'Transform foto menjadi anime style (Anything V5)',
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

// Model: Anything V5 (best for anime style)
const PROMPT = `anime style illustration, 
same identity and facial structure, 
clean anime lineart, soft shading,
big expressive eyes, smooth skin,
high quality anime render, masterpiece`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🎌 *ᴛᴏ ᴀɴɪᴍᴇ (ᴀɴʏᴛʜɪɴɢ ᴠ5)*\n\n> Reply atau kirim gambar dengan caption .toanime`)
    }
    
    await m.react('🎌')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Menggunakan Anything V5...\n> _Mohon bersabar..._`)
    
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
        
        // Use Anything V5 for anime style
        const result = await nanobanana.generateAnime(PROMPT)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat memproses gambar'}`)
        }
        
        await m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🎌 *ᴛᴏ ᴀɴɪᴍᴇ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n> _Model: ${result.model || 'Anything V5'}_`
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
