const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'tocartoon',
    alias: ['cartoon', 'kartun'],
    category: 'ai',
    description: 'Transform foto menjadi cartoon style (DreamShaper)',
    usage: '.tocartoon',
    example: '.tocartoon',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

// Model: DreamShaper (best for cartoon/stylized art)
const PROMPT = `cartoon illustration style,
same identity, simplified features,
smooth shading, bright vivid colors,
clean cartoon render, disney pixar style`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🎨 *ᴛᴏ ᴄᴀʀᴛᴏᴏɴ (ᴅʀᴇᴀᴍsʜᴀᴘᴇʀ)*\n\n> Reply atau kirim gambar dengan caption .tocartoon`)
    }
    
    await m.react('🎨')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Menggunakan DreamShaper...\n> _Mohon bersabar..._`)
    
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
        
        // Use DreamShaper for cartoon style
        const result = await nanobanana.generateDream(PROMPT)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat memproses gambar'}`)
        }
        
        await m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🎨 *ᴛᴏ ᴄᴀʀᴛᴏᴏɴ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n> _Model: ${result.model || 'DreamShaper'}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[tocartoon] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
