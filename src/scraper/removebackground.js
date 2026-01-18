const axios = require('axios')
const FormData = require('form-data')

/**
 * Remove Background using multiple free APIs
 * Fallbacks: remove.bg free tier, photoroom, iloveimg
 */

require('dotenv').config()

async function removebg(imageBuffer) {
    try {
        if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
            throw new Error('Image buffer required')
        }

        // Method 1: remove.bg API (if API key available)
        const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY
        if (REMOVEBG_API_KEY) {
            try {
                console.log('[RemoveBG] Using remove.bg API...')
                const form = new FormData()
                form.append('image_file', imageBuffer, { filename: 'image.png' })
                form.append('size', 'auto')

                const { data } = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
                    headers: {
                        ...form.getHeaders(),
                        'X-Api-Key': REMOVEBG_API_KEY
                    },
                    responseType: 'arraybuffer',
                    timeout: 60000
                })

                console.log('[RemoveBG] ✓ Success with remove.bg')
                return { success: true, buffer: Buffer.from(data) }
            } catch (e) {
                console.log('[RemoveBG] remove.bg failed:', e.message)
            }
        }

        // Method 2: photoroom free API
        try {
            console.log('[RemoveBG] Trying photoroom...')
            const form = new FormData()
            form.append('image_file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' })

            const { data } = await axios.post('https://sdk.photoroom.com/v1/segment', form, {
                headers: {
                    ...form.getHeaders(),
                    'x-api-key': 'sandbox_ae74f7c6c4b1bb8c09977ab0a11a1e9e5bb3e3bc'
                },
                responseType: 'arraybuffer',
                timeout: 60000
            })

            console.log('[RemoveBG] ✓ Success with photoroom')
            return { success: true, buffer: Buffer.from(data) }
        } catch (e) {
            console.log('[RemoveBG] photoroom failed:', e.message)
        }

        // Method 3: rembg via HuggingFace
        const HF_TOKEN = process.env.HF_TOKEN
        if (HF_TOKEN) {
            try {
                console.log('[RemoveBG] Trying HuggingFace rembg...')
                const form = new FormData()
                form.append('file', imageBuffer, { filename: 'image.png' })

                const { data } = await axios.post(
                    'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
                    imageBuffer,
                    {
                        headers: {
                            'Authorization': `Bearer ${HF_TOKEN}`,
                            'Content-Type': 'application/octet-stream'
                        },
                        responseType: 'arraybuffer',
                        timeout: 60000
                    }
                )

                console.log('[RemoveBG] ✓ Success with HuggingFace')
                return { success: true, buffer: Buffer.from(data) }
            } catch (e) {
                console.log('[RemoveBG] HuggingFace failed:', e.message)
            }
        }

        throw new Error('Semua metode gagal. Pastikan HF_TOKEN atau REMOVEBG_API_KEY ada di .env')

    } catch (e) {
        return { success: false, error: e.message }
    }
}

module.exports = removebg
