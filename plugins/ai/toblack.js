const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Transform karakter menjadi berkulit hitam pekat (Hugging Face AI)',
    usage: '.toblack',
    example: '.toblack',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    limit: 1,
    isEnabled: true
}

// Model: SDXL (photorealistic for skin tone changes)
const PROMPT = `person with very dark black ebony skin, 
dark African complexion, same pose, same clothes, 
same background, photorealistic, high quality, 
detailed skin texture, natural lighting`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    
    if (!isImage) {
        return m.reply(
            `🖤 *ᴛᴏ ʙʟᴀᴄᴋ (ʜᴜɢɢɪɴɢ ꜰᴀᴄᴇ)*\n\n` +
            `> Mengubah kulit karakter menjadi hitam pekat\n` +
            `> Reply atau kirim gambar dengan: ${m.prefix}hitam`
        )
    }
    
    await m.react('🖤')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Menggunakan Hugging Face SDXL...\n> _Mohon bersabar..._`)
    
    try {
        let mediaBuffer = null
        if (m.isImage && typeof m.download === 'function') {
            mediaBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && typeof m.quoted.download === 'function') {
            mediaBuffer = await m.quoted.download()
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            await m.react('❌')
            return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Gagal mengunduh gambar`)
        }
        
        // Use SDXL for photorealistic skin transformation
        const result = await nanobanana.generateImage(PROMPT, 'sdxl')
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Gagal transformasi gambar\n` +
                `> _${result.error || 'API Error'}_`
            )
        }
        
        await m.react('🔥')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n` +
                `> ᴛʀᴀɴsꜰᴏʀᴍ sᴜᴄᴄᴇss\n` +
                `> _Model: ${result.model || 'SDXL'}_\n` +
                `> _Powered by Hugging Face_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[toblack] Handler Error:', error)
        await m.react('❌')
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> ${error.message || 'Terjadi kesalahan sistem'}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
