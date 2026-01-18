const puterImg2Img = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Transform karakter menjadi berkulit hitam pekat (Puter AI - Gemini Flash)',
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

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    
    if (!isImage) {
        return m.reply(
            `🖤 *ᴛᴏ ʙʟᴀᴄᴋ (ᴘᴜᴛᴇʀ ᴀɪ)*\n\n` +
            `> Mengubah kulit karakter menjadi hitam pekat\n` +
            `> Reply atau kirim gambar dengan: ${m.prefix}hitam`
        )
    }
    
    await m.react('🖤')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Menggunakan Puter AI (Gemini 2.5 Flash)...\n> _Mohon bersabar..._`)
    
    try {
        // 1. Download image
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
        
        // 2. Transform using Puter AI
        // Detailed prompt to ensure character consistency
        const prompt = "Transform the character's skin to be very dark black (ebony complexion). Keep the same pose, same clothes, same eyes, same background, same art style. Only change the skin tone to be dark black African skin."
        
        const result = await puterImg2Img(mediaBuffer, prompt)
        
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
                `> _Model: Gemini 2.5 Flash_\n` +
                `> _Powered by Puter AI_`
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
