const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'tomanga',
    alias: ['manga'],
    category: 'ai',
    description: 'Transform foto menjadi manga style (Counterfeit)',
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

// Model: Counterfeit (high quality manga illustration)
const PROMPT = `black and white manga style,
clean ink lineart, screentone shading,
high contrast, japanese manga panel look,
detailed manga illustration, masterpiece`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`📖 *ᴛᴏ ᴍᴀɴɢᴀ (ᴄᴏᴜɴᴛᴇʀꜰᴇɪᴛ)*\n\n> Reply atau kirim gambar dengan caption .tomanga`)
    }
    
    await m.react('📖')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Menggunakan Counterfeit...\n> _Mohon bersabar..._`)
    
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
        
        // Use Counterfeit for manga style
        const result = await nanobanana.generateCounterfeit(PROMPT)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat memproses gambar'}`)
        }
        
        await m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `📖 *ᴛᴏ ᴍᴀɴɢᴀ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n> _Model: ${result.model || 'Counterfeit'}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[tomanga] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
