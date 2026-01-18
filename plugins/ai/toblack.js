const Jimp = require('jimp')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Transform foto dengan tone lebih gelap',
    usage: '.hitam',
    example: '.hitam',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

/**
 * Apply dark/melanin filter to image using Jimp
 * This works 100% offline without any external API
 */
async function applyDarkFilter(imageBuffer) {
    try {
        const image = await Jimp.read(imageBuffer)
        
        // Darken the image
        image.brightness(-0.15)  // Slightly darker
        
        // Adjust contrast for richer tones
        image.contrast(0.1)
        
        // Apply warm/brown tint for natural skin tone look
        image.color([
            { apply: 'saturate', params: [15] },      // More saturated
            { apply: 'hue', params: [-5] },           // Slight warm shift
            { apply: 'mix', params: [{ r: 139, g: 90, b: 43 }, 15] }  // Brown tint
        ])
        
        // Get buffer
        const outputBuffer = await image.getBufferAsync(Jimp.MIME_JPEG)
        return { success: true, buffer: outputBuffer }
        
    } catch (error) {
        console.error('[toblack] Jimp Error:', error.message)
        return { success: false, error: error.message }
    }
}

async function handler(m, { sock }) {
    // Check for image - works in both group and private
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    
    if (!isImage) {
        return m.reply(
            `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n` +
            `> Reply atau kirim gambar dengan caption\n` +
            `> ${m.prefix}hitam`
        )
    }
    
    await m.react('🖤')
    
    try {
        // Download image - handle both direct and quoted
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
        
        // Apply dark filter
        const result = await applyDarkFilter(mediaBuffer)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Gagal memproses gambar\n` +
                `> ${result.error || 'Unknown error'}`
            )
        }
        
        await m.react('🔥')
        
        // Send result
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n> _Powered by KYOKO MD_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[toblack] Handler Error:', error)
        await m.react('❌')
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> ${error.message || 'Terjadi kesalahan'}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
