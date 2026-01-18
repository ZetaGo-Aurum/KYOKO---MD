const axios = require('axios')
const FormData = require('form-data')

/**
 * Image Upscaler using multiple free APIs
 */

require('dotenv').config()

async function upscaler(imageBuffer) {
    try {
        if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
            throw new Error('Image buffer required')
        }

        // Method 1: upscale.media free API
        try {
            console.log('[Upscaler] Trying upscale.media...')
            const form = new FormData()
            form.append('image', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
            form.append('scale', '2')

            const { data } = await axios.post('https://api.upscale.media/v1/upscale', form, {
                headers: {
                    ...form.getHeaders(),
                    'Accept': 'application/json'
                },
                timeout: 120000
            })

            if (data?.result_url) {
                const imgResponse = await axios.get(data.result_url, { responseType: 'arraybuffer' })
                console.log('[Upscaler] ✓ Success with upscale.media')
                return { success: true, buffer: Buffer.from(imgResponse.data) }
            }
        } catch (e) {
            console.log('[Upscaler] upscale.media failed:', e.message)
        }

        // Method 2: HuggingFace ESRGAN
        const HF_TOKEN = process.env.HF_TOKEN
        if (HF_TOKEN) {
            try {
                console.log('[Upscaler] Trying HuggingFace ESRGAN...')
                const { data } = await axios.post(
                    'https://api-inference.huggingface.co/models/caidas/swin2SR-realworld-sr-x4-64-bsrgan-psnr',
                    imageBuffer,
                    {
                        headers: {
                            'Authorization': `Bearer ${HF_TOKEN}`,
                            'Content-Type': 'application/octet-stream'
                        },
                        responseType: 'arraybuffer',
                        timeout: 120000
                    }
                )

                console.log('[Upscaler] ✓ Success with HuggingFace')
                return { success: true, buffer: Buffer.from(data) }
            } catch (e) {
                console.log('[Upscaler] HuggingFace failed:', e.message)
            }
        }

        // Method 3: Original aienhancer.ai
        try {
            console.log('[Upscaler] Trying aienhancer.ai...')
            const base64 = imageBuffer.toString('base64')

            const headers = {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                'Content-Type': 'application/json',
                'origin': 'https://aienhancer.ai',
                'referer': 'https://aienhancer.ai/ai-image-upscaler'
            }

            const create = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/create', {
                model: 3,
                image: `data:image/jpeg;base64,${base64}`,
                settings: 'kRpBbpnRCD2nL2RxnnuoMo7MBc0zHndTDkWMl9aW+Gw='
            }, { headers, timeout: 30000 })

            const id = create.data.data.id

            for (let i = 0; i < 15; i++) {
                await new Promise(r => setTimeout(r, 3000))

                const result = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/result', 
                    { task_id: id }, 
                    { headers }
                )

                const data = result.data.data
                if (data && data.output) {
                    const imgResponse = await axios.get(data.output, { responseType: 'arraybuffer' })
                    console.log('[Upscaler] ✓ Success with aienhancer')
                    return { success: true, buffer: Buffer.from(imgResponse.data) }
                }
            }
        } catch (e) {
            console.log('[Upscaler] aienhancer failed:', e.message)
        }

        throw new Error('Semua metode upscale gagal')

    } catch (e) {
        return { success: false, error: e.message }
    }
}

module.exports = upscaler
