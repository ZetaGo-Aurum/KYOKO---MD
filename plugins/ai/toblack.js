const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Transform kulit karakter menjadi hitam pekat (TRUE Img2Img)',
    usage: '.toblack',
    example: '.toblack',
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
        return m.reply(
            `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n` +
            `> Mengubah kulit karakter menjadi hitam pekat\n` +
            `> Gambar ASLI akan dipertahankan!\n` +
            `> Reply atau kirim gambar dengan: ${m.prefix}hitam`
        )
    }
    
    await m.react('🖤')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Menggunakan TRUE Img2Img...\n> _Gambar asli akan dipertahankan..._`)
    
    try {
        // Download reference image
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
        
        // Use specialized toBlack function (preserves original image)
        const result = await nanobanana.toBlack(mediaBuffer)
        
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
                `> _Model: ${result.model || 'Realistic'}_\n` +
                `> _Strength: ${result.strength || 0.35}_\n` +
                `> _TRUE Img2Img - Gambar asli dipertahankan_`
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
