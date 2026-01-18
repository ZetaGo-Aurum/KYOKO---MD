const axios = require('axios');
const fs = require('fs');
require('dotenv').config(); // Ensure env vars are loaded explicitly

/**
 * Use Puter AI for Image-to-Image transformation
 * HYBRID IMPLEMENTATION:
 * 1. Tries to use @heyputer/puter.js library if `puterAuthToken` is present
 * 2. Falls back to Pollinations.ai if token is missing or library fails
 * 
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {string} prompt - Prompt for transformation
 * @returns {Promise<Object>} Result object { success: boolean, buffer?: Buffer, error?: string }
 */
async function puterImg2Img(imageBuffer, prompt) {
    // 1. Check for Auth Token first
    const token = process.env.puterAuthToken || process.env.PUTER_TOKEN;

    if (!token) {
        console.warn('[Puter] No token found. Using Pollinations AI Fallback.');
        return await pollinationsImg2Img(imageBuffer, prompt);
    }

    // 2. Try using the Puter.js library
    try {
        console.log('[Puter] Token found. Attempting to use Puter.js library...');
        
        // Lazy load to prevent startup crashes
        let puter;
        try {
            // Using the user-suggested init method
            const { init } = require('@heyputer/puter.js/src/init.cjs');
            puter = init(token);
        } catch (libErr) {
            console.warn('[Puter] Library init failed, trying alternate import or fallback:', libErr.message);
            // Fallback to simpler require if specific path fails
            try {
                const puterLib = require('@heyputer/puter.js');
                puter = new puterLib(token);
            } catch (e) {
                throw new Error('Failed to load Puter.js library: ' + e.message);
            }
        }

        console.log('[Puter] Processing Img2Img with Gemini 2.5 Flash...');

        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg'; 

        const imageElement = await puter.ai.txt2img(prompt, {
            input_image: base64Image,
            input_image_mime_type: mimeType,
            model: 'gemini-2.5-flash-latest'
        });

        let src = imageElement.src || imageElement.url;
        if (!src && typeof imageElement === 'string') src = imageElement;

        if (!src) throw new Error('No image source returned from Puter AI');

        if (src.startsWith('data:image')) {
            const base64Data = src.split(',')[1];
            return {
                success: true,
                buffer: Buffer.from(base64Data, 'base64')
            };
        } else if (src.startsWith('http')) {
            const imgRes = await axios.get(src, { responseType: 'arraybuffer' });
            return {
                success: true,
                buffer: Buffer.from(imgRes.data)
            };
        } else {
            throw new Error('Unknown output format from Puter.js');
        }

    } catch (error) {
        console.error('[Puter] Library/API Error:', error.message);
        console.log('[Puter] Switching to Pollinations Fallback...');
        return await pollinationsImg2Img(imageBuffer, prompt);
    }
}

/**
 * Fallback to Pollinations.ai (Free, No Token)
 * Supports Img2Img via URL parameter
 */
async function pollinationsImg2Img(imageBuffer, prompt) {
    try {
        console.log('[Pollinations] Processing Img2Img (Fallback)...');
        
        // 1. Upload image to temporary host (catbox) because Pollinations needs URL
        const FormData = require('form-data');
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('userhash', '');
        form.append('fileToUpload', imageBuffer, { filename: 'image.jpg' });

        const uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            timeout: 30000
        });

        const imageUrl = uploadRes.data?.trim();
        if (!imageUrl || !imageUrl.startsWith('http')) {
            throw new Error('Gagal upload temporary image untuk Pollinations');
        }

        // 2. Call Pollinations
        // Model: flux is good for realism
        const safePrompt = encodeURIComponent(prompt + ", dark black skin, ebony, photorealistic, 8k");
        const safeImage = encodeURIComponent(imageUrl);
        
        // Random seed to prevent caching
        const seed = Math.floor(Math.random() * 1000000);
        
        const pollUrl = `https://image.pollinations.ai/prompt/${safePrompt}?image=${safeImage}&width=1024&height=1024&model=flux&seed=${seed}&nologo=true&enhance=false`;

        const imgRes = await axios.get(pollUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        return {
            success: true,
            buffer: Buffer.from(imgRes.data)
        };

    } catch (error) {
        console.error('[Pollinations] Error:', error.message);
        return {
            success: false,
            error: `Gagal (Pollinations): ${error.message}`
        };
    }
}

module.exports = puterImg2Img;