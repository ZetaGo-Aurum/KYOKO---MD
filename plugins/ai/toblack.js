const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Transform foto dengan skin tone lebih gelap',
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

/**
 * Image Editor API - transforms image based on prompt
 */
async function generateImage(imageBuffer, prompt) {
    try {
        // Method 1: imgeditor.co API
        const infoRes = await axios.post('https://imgeditor.co/api/get-upload-url', {
            fileName: 'image.jpg',
            contentType: 'image/jpeg',
            fileSize: imageBuffer.length
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        })
        
        const info = infoRes.data
        if (!info?.uploadUrl || !info?.publicUrl) {
            throw new Error('Upload URL not available')
        }
        
        // Upload image
        await axios.put(info.uploadUrl, imageBuffer, {
            headers: { 'Content-Type': 'image/jpeg' },
            timeout: 60000
        })
        
        // Generate
        const genRes = await axios.post('https://imgeditor.co/api/generate-image', {
            prompt,
            styleId: 'realistic',
            mode: 'image',
            imageUrl: info.publicUrl,
            imageUrls: [info.publicUrl],
            numImages: 1,
            outputFormat: 'png',
            model: 'nano-banana'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000
        })
        
        const gen = genRes.data
        if (!gen?.taskId) {
            throw new Error('Task ID not received')
        }
        
        // Poll for result
        let status
        let attempts = 0
        const maxAttempts = 30
        
        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 3000))
            attempts++
            
            const statusRes = await axios.get(
                `https://imgeditor.co/api/generate-image/status?taskId=${gen.taskId}`,
                { timeout: 15000 }
            )
            status = statusRes.data
            
            if (status?.status === 'completed' && status?.imageUrl) {
                return { success: true, imageUrl: status.imageUrl }
            }
            if (status?.status === 'failed') {
                throw new Error('Generation failed')
            }
        }
        
        throw new Error('Timeout waiting for result')
        
    } catch (error) {
        console.error('[toblack] API Error:', error.message)
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
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Sedang memproses gambar...`)
    
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
        
        // Transform prompt
        const prompt = `natural darker skin tone, same identity, realistic face, rich skin texture, soft lighting, photorealistic, balanced exposure`
        
        const result = await generateImage(mediaBuffer, prompt)
        
        if (!result.success || !result.imageUrl) {
            await m.react('❌')
            return m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> API sedang tidak tersedia\n` +
                `> Coba lagi nanti`
            )
        }
        
        await m.react('🔥')
        
        // Send result
        await sock.sendMessage(m.chat, {
            image: { url: result.imageUrl },
            caption: `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ`
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
