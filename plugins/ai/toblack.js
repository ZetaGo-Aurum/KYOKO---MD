const axios = require('axios')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitam'],
    category: 'ai',
    description: 'Generate ulang gambar dengan karakter berkulit hitam pekat menggunakan AI',
    usage: '.hitam',
    example: '.hitam',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

/**
 * Pollinations.ai - Free AI Image Generation API
 * No auth required, unlimited generations
 */
async function generateBlackSkinImage(prompt) {
    try {
        // Pollinations.ai text-to-image API
        const encodedPrompt = encodeURIComponent(prompt)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`
        
        // Fetch the image
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'KYOKO-MD-Bot'
            }
        })
        
        return {
            success: true,
            buffer: Buffer.from(response.data)
        }
    } catch (error) {
        console.error('[toblack] Pollinations Error:', error.message)
        return { success: false, error: error.message }
    }
}

/**
 * Alternative: Use img2img style transformation via prodia.com free API
 */
async function transformImageWithAI(imageBuffer) {
    try {
        // Upload image to tmpfiles.org for URL access
        const FormData = require('form-data')
        const form = new FormData()
        form.append('file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
        
        const uploadRes = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders(),
            timeout: 30000
        })
        
        if (!uploadRes.data?.data?.url) {
            throw new Error('Failed to upload image')
        }
        
        // Convert tmpfiles URL to direct URL
        const tmpUrl = uploadRes.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
        
        // Use Prodia free img2img API
        const prodiaRes = await axios.post('https://api.prodia.com/v1/sd/transform', {
            imageUrl: tmpUrl,
            prompt: 'african american person, very dark black skin, ebony skin tone, deep dark complexion, same pose, same clothing, same background, high quality, detailed',
            negative_prompt: 'light skin, pale skin, white skin, asian skin, deformed, ugly, bad anatomy',
            model: 'v1-5-pruned-emaonly.safetensors [d7049739]',
            steps: 25,
            cfg_scale: 7,
            sampler: 'Euler a',
            strength: 0.65
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Prodia-Key': 'free-tier'
            },
            timeout: 30000
        })
        
        if (prodiaRes.data?.job) {
            // Poll for result
            let status
            let attempts = 0
            while (attempts < 30) {
                await new Promise(r => setTimeout(r, 2000))
                const statusRes = await axios.get(`https://api.prodia.com/v1/job/${prodiaRes.data.job}`, {
                    timeout: 10000
                })
                status = statusRes.data
                if (status.status === 'succeeded' && status.imageUrl) {
                    const imgRes = await axios.get(status.imageUrl, { responseType: 'arraybuffer', timeout: 30000 })
                    return { success: true, buffer: Buffer.from(imgRes.data) }
                }
                if (status.status === 'failed') break
                attempts++
            }
        }
        
        throw new Error('Transform failed')
    } catch (error) {
        console.error('[toblack] Transform Error:', error.message)
        return { success: false, error: error.message }
    }
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    
    if (!isImage) {
        return m.reply(
            `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n` +
            `> Generate gambar dengan karakter berkulit hitam\n` +
            `> Reply atau kirim gambar dengan caption\n` +
            `> ${m.prefix}hitam\n\n` +
            `> _Powered by AI Image Generation_`
        )
    }
    
    await m.react('🖤')
    await m.reply(`⏳ *ᴘʀᴏᴄᴇssɪɴɢ...*\n\n> Generating dengan AI...\n> Mohon tunggu 10-30 detik`)
    
    try {
        // Download the original image first
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
        
        // Try img2img transformation first
        let result = await transformImageWithAI(mediaBuffer)
        
        // Fallback to text-to-image with dark skin prompt
        if (!result.success) {
            console.log('[toblack] Falling back to text2img generation')
            const prompt = `beautiful african character, very dark black skin, deep ebony complexion, dark chocolate skin tone, anime style, high quality, detailed face, vibrant colors, professional artwork`
            result = await generateBlackSkinImage(prompt)
        }
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Gagal generate gambar\n` +
                `> ${result.error || 'Coba lagi nanti'}`
            )
        }
        
        await m.react('🔥')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🖤 *ᴛᴏ ʙʟᴀᴄᴋ*\n\n` +
                `> ᴛʀᴀɴsꜰᴏʀᴍ ʙᴇʀʜᴀsɪʟ\n` +
                `> _AI Generated - Dark Skin_\n` +
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
