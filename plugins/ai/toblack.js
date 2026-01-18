const Jimp = require('jimp')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Transform warna kulit menjadi lebih gelap/hitam',
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
 * Check if a pixel color is within skin tone range
 * Uses multiple skin color detection algorithms for better accuracy
 */
function isSkinColor(r, g, b) {
    // Method 1: RGB ratio-based detection
    const rgbSkin = (
        r > 95 && g > 40 && b > 20 &&
        (Math.max(r, g, b) - Math.min(r, g, b)) > 15 &&
        Math.abs(r - g) > 15 &&
        r > g && r > b
    )
    
    // Method 2: YCbCr color space detection (more accurate for various skin tones)
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    
    const ycbcrSkin = (
        y > 80 &&
        cb > 77 && cb < 127 &&
        cr > 133 && cr < 173
    )
    
    // Method 3: HSV-based detection for broader skin tones
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min
    
    let h = 0
    if (diff !== 0) {
        if (max === r) h = ((g - b) / diff) % 6
        else if (max === g) h = (b - r) / diff + 2
        else h = (r - g) / diff + 4
        h = Math.round(h * 60)
        if (h < 0) h += 360
    }
    
    const s = max === 0 ? 0 : (diff / max) * 100
    const v = (max / 255) * 100
    
    // Skin tones typically fall in hue range 0-50 (red to yellow-orange)
    const hsvSkin = (
        h >= 0 && h <= 50 &&
        s >= 15 && s <= 75 &&
        v >= 30 && v <= 95
    )
    
    // Return true if at least 2 methods agree
    const score = (rgbSkin ? 1 : 0) + (ycbcrSkin ? 1 : 0) + (hsvSkin ? 1 : 0)
    return score >= 2
}

/**
 * Transform skin pixels to darker/black skin tone
 */
function transformToBlackSkin(r, g, b, intensity = 0.7) {
    // Target: dark brown/black skin tones
    // Dark skin RGB ranges: R(40-100), G(30-70), B(20-50)
    
    // Calculate how "skin-like" this pixel is (for blending)
    const skinFactor = Math.min(1, (r - b) / 100)
    
    // Dark skin base colors
    const darkR = 60 + Math.random() * 20  // 60-80
    const darkG = 40 + Math.random() * 15  // 40-55  
    const darkB = 30 + Math.random() * 10  // 30-40
    
    // Blend original with dark skin, preserving some texture
    const blendFactor = intensity * skinFactor
    
    // Preserve shadows and highlights for realistic look
    const brightness = (r + g + b) / 3 / 255
    const shadowBoost = brightness < 0.4 ? 0.8 : 1
    const highlightBoost = brightness > 0.7 ? 1.2 : 1
    
    const newR = Math.round((r * (1 - blendFactor) + darkR * blendFactor) * shadowBoost * highlightBoost)
    const newG = Math.round((g * (1 - blendFactor) + darkG * blendFactor) * shadowBoost * highlightBoost)
    const newB = Math.round((b * (1 - blendFactor) + darkB * blendFactor) * shadowBoost * highlightBoost)
    
    return {
        r: Math.max(0, Math.min(255, newR)),
        g: Math.max(0, Math.min(255, newG)),
        b: Math.max(0, Math.min(255, newB))
    }
}

/**
 * Apply dark skin filter - only affects skin-colored pixels
 */
async function applyDarkSkinFilter(imageBuffer) {
    try {
        const image = await Jimp.read(imageBuffer)
        const width = image.getWidth()
        const height = image.getHeight()
        
        // Process each pixel
        image.scan(0, 0, width, height, function(x, y, idx) {
            const r = this.bitmap.data[idx]
            const g = this.bitmap.data[idx + 1]
            const b = this.bitmap.data[idx + 2]
            // Alpha channel at idx + 3
            
            // Check if pixel is skin-colored
            if (isSkinColor(r, g, b)) {
                // Transform to dark skin
                const newColor = transformToBlackSkin(r, g, b, 0.75)
                
                this.bitmap.data[idx] = newColor.r
                this.bitmap.data[idx + 1] = newColor.g
                this.bitmap.data[idx + 2] = newColor.b
                // Keep original alpha
            }
            // Non-skin pixels remain unchanged
        })
        
        // Slight contrast boost for better look
        image.contrast(0.05)
        
        const outputBuffer = await image.getBufferAsync(Jimp.MIME_JPEG)
        return { success: true, buffer: outputBuffer }
        
    } catch (error) {
        console.error('[toblack] Processing Error:', error.message)
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
            `> ${m.prefix}hitam\n\n` +
            `> _Smart skin detection - hanya warna kulit yang diubah_`
        )
    }
    
    await m.react('🖤')
    
    try {
        // Download image
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
        
        // Apply smart dark skin filter
        const result = await applyDarkSkinFilter(mediaBuffer)
        
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
            caption: `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n` +
                `> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n` +
                `> _Smart skin detection applied_\n` +
                `> _Powered by KYOKO MD_`
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
