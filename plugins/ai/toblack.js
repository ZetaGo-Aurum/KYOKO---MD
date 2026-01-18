const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Transform karakter menjadi berkulit hitam pekat (Img2Img)',
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

/**
 * Upload image to Catbox.moe
 * More stable and faster than tmpfiles for API usage
 */
async function uploadToCatbox(buffer) {
    try {
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('userhash', '')
        form.append('fileToUpload', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            timeout: 60000 // 60s timeout for upload
        })

        if (response.data && response.data.startsWith('http')) {
            return response.data.trim()
        }
        throw new Error('Upload failed')
    } catch (error) {
        console.error('[toblack] Catbox Upload Error:', error.message)
        throw new Error('Gagal mengupload gambar ke server')
    }
}

/**
 * Pollinations.ai Img2Img Transformation
 * Uses ?image=URL parameter to preserve original composition
 */
async function transformImg2Img(imageUrl, prompt) {
    try {
        const encodedPrompt = encodeURIComponent(prompt)
        const encodedImage = encodeURIComponent(imageUrl)
        
        // Construct Img2Img URL
        // model=flux is generally good for prompt adherence
        // seed helps stability
        const seed = Math.floor(Math.random() * 1000000)
        const api = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=1024&height=1024&model=flux&seed=${seed}&nologo=true`
        
        console.log('[toblack] Generatig: ', api)
        
        const response = await axios.get(api, {
            responseType: 'arraybuffer',
            timeout: 120000, // 2 minutes timeout for generation
            headers: {
                'User-Agent': 'KYOKO-MD-Bot/2.0'
            }
        })
        
        return {
            success: true,
            buffer: Buffer.from(response.data)
        }
    } catch (error) {
        console.error('[toblack] Transform Error:', error.message)
        // Check for specific error types
        if (error.code === 'ECONNABORTED') return { success: false, error: 'Waktu habis (timeout), server sibuk' }
        if (error.response?.status === 429) return { success: false, error: 'Terlalu banyak request, coba lagi nanti' }
        return { success: false, error: error.message }
    }
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    
    if (!isImage) {
        return m.reply(
            `🖤 *ᴛᴏ ʙʟᴀᴄᴋ (ɪᴍɢ2ɪᴍɢ)*\n\n` +
            `> Mengubah kulit karakter menjadi hitam pekat\n` +
            `> Reply atau kirim gambar dengan: ${m.prefix}hitam`
        )
    }
    
    await m.react('🖤')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> 1. Uploading image...\n> 2. Transforming skin tone...\n> _Mohon bersabar, proses bisa memakan waktu 1 menit_`)
    
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
        
        // 2. Upload to Catbox
        const imageUrl = await uploadToCatbox(mediaBuffer)
        console.log('[toblack] Uploaded to:', imageUrl)
        
        // 3. Transform using Img2Img
        // Strong prompt for dark skin black complexion
        const prompt = "((very dark black skin)), ((ebony skin tone)), ((deep darkest complexion)), african descendant, same character, same pose, same clothing, same background, exact details, high quality, masterpiece, 8k resolution"
        
        const result = await transformImg2Img(imageUrl, prompt)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Gagal transformasi gambar\n` +
                `> _${result.error || 'Server sibuk'}_`
            )
        }
        
        await m.react('🔥')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n` +
                `> ᴛʀᴀɴsꜰᴏʀᴍ sᴜᴄᴄᴇss\n` +
                `> _Img2Img Dark Skin v2_\n` +
                `> _Powered by Pollinations.ai_`
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
