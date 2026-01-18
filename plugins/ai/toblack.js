const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Transform karakter menjadi berkulit hitam pekat (Preserve Details)',
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
 */
async function uploadToCatbox(buffer) {
    try {
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('userhash', '')
        form.append('fileToUpload', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            timeout: 60000 
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
 * Optimized for STRICT detail preservation
 */
async function transformImg2Img(imageUrl, prompt) {
    try {
        const encodedPrompt = encodeURIComponent(prompt)
        const encodedImage = encodeURIComponent(imageUrl)
        
        // Optimizations for preserving details:
        // 1. negative_prompt: prevent changing key features
        // 2. nologo=true
        // 3. enhance=false (prevent AI from hallucinations)
        
        const negPrompt = encodeURIComponent("changing clothes, changing background, changing pose, different hair style, different eye color, bright skin, white skin, pale skin, monochrome, grayscale, low quality, bad anatomy")
        
        const seed = Math.floor(Math.random() * 1000000)
        
        // Using `enhance=false` is KEY to keeping original style
        const api = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=768&height=768&seed=${seed}&nologo=true&enhance=false&negative_prompt=${negPrompt}`
        
        console.log('[toblack] Generating: ', api)
        
        const response = await axios.get(api, {
            responseType: 'arraybuffer',
            timeout: 300000, // 5 mins
            headers: {
                'User-Agent': 'KYOKO-MD-Bot/2.2'
            }
        })
        
        return {
            success: true,
            buffer: Buffer.from(response.data)
        }
    } catch (error) {
        console.error('[toblack] Transform Error:', error.message)
        if (error.code === 'ECONNABORTED') return { success: false, error: 'Waktu habis (timeout), server sibuk' }
        return { success: false, error: error.message }
    }
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    
    if (!isImage) {
        return m.reply(
            `🖤 *ᴛᴏ ʙʟᴀᴄᴋ (ᴘʀᴇsᴇʀᴠᴇ)*\n\n` +
            `> Ubah warna kulit jadi hitam pekat TANPA ubah desain karakter\n` +
            `> Reply atau kirim gambar dengan: ${m.prefix}hitam`
        )
    }
    
    await m.react('🖤')
    // Processing message
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Mengubah warna kulit & mempertahankan detail asli...\n> _Mohon tunggu..._`)
    
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
        
        // 3. Transform using Img2Img with PRESERVE prompt
        // Using "recolor" keyword helps AI understand we only want to change color
        const prompt = "recolor skin to very dark black skin tone, deep ebony complexion, keep everything else exactly same, same hair color, same eye color, same clothing, same background, same art style, high fidelity"
        
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
                `> _Mode: Strict Detail Preservation_\n` +
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
