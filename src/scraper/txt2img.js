const axios = require('axios')

/**
 * Text-to-Image Scraper using HuggingFace API
 * Kept for backward compatibility, but use nanobanana.generateImage() instead
 */

require('dotenv').config()

const HF_TOKEN = process.env.HF_TOKEN

async function txt2img(prompt, style = 'default') {
    if (!prompt) throw new Error('Prompt is required')
    
    const modelMap = {
        'default': 'stabilityai/stable-diffusion-xl-base-1.0',
        'anime': 'stablediffusionapi/anything-v5',
        'realistic': 'Lykon/dreamshaper-8',
        'photorealistic': 'stabilityai/stable-diffusion-xl-base-1.0'
    }
    
    const modelId = modelMap[style] || modelMap['default']
    const apiUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`
    
    try {
        if (!HF_TOKEN) {
            throw new Error('HF_TOKEN tidak ditemukan di .env')
        }
        
        const response = await axios.post(apiUrl, {
            inputs: prompt
        }, {
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'image/png'
            },
            responseType: 'arraybuffer',
            timeout: 120000
        })
        
        return Buffer.from(response.data)
        
    } catch (error) {
        throw new Error(`TXT2IMG Error: ${error.message}`)
    }
}

module.exports = txt2img
