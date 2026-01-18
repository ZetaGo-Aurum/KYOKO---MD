const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

/**
 * Use Puter AI for Image-to-Image transformation (Direct API)
 * Removes dependency on @heyputer/puter.js library to fix auth issues and crashes.
 * WARNING: NO FALLBACK implemented as per user request.
 * 
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {string} prompt - Prompt for transformation
 * @returns {Promise<Object>} Result object { success: boolean, buffer?: Buffer, error?: string }
 */
async function puterImg2Img(imageBuffer, prompt) {
    // 1. Get Token
    const rawToken = process.env.puterAuthToken || process.env.PUTER_TOKEN;
    if (!rawToken) {
        return {
            success: false,
            error: 'Token Puter (puterAuthToken) Kosong! Silakan isi di .env dulu.'
        };
    }

    // Clean token
    let token = rawToken.trim();
    // Remove "Bearer " if likely double-pasted, though we add it manually later
    if (token.startsWith('Bearer ')) token = token.replace('Bearer ', '');
    // Remove quotes if any
    token = token.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

    console.log(`[Puter] Using Token: ${token.substring(0, 10)}...`);

    // 2. Prepare Direct API Call
    const base64Image = imageBuffer.toString('base64');
    
    // Construct payload strictly matching Puter's internal driver format
    const payload = {
        interface: 'puter-image-generation',
        driver: 'ai-image',
        method: 'generate',
        args: {
            prompt: prompt,
            input_image: base64Image,
            input_image_mime_type: 'image/jpeg',
            model: 'gemini-2.5-flash-latest'
        },
        auth_token: token,
        test_mode: false
    };

    try {
        console.log('[Puter] Sending request to Gemini 2.5 Flash via Direct API...');
        
        const res = await axios.post('https://api.puter.com/drivers/call', payload, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': `Bearer ${token}`,
                'Origin': 'https://puter.com',
                'Referer': 'https://puter.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 60000 // 60s timeout
        });

        // Check internal success flag
        if (res.data.success === false) {
             throw new Error(`API returned failure: ${JSON.stringify(res.data.error || res.data)}`);
        }

        // Parse result
        const result = res.data.result;
        let src = result.src || result.url;
        if (!src && typeof result === 'string') src = result;

        if (!src) throw new Error('No image source returned from Puter AI');

        // Handle output format
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
            console.warn('[Puter] Unknown output format, dumping result:', result);
            throw new Error('Unknown output format from Puter API');
        }

    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('[Puter] Error:', errorMsg);
        
        // Detailed log for debugging
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        }

        // Return failed result (NO FALLBACK)
        return {
            success: false,
            error: `Gagal (Puter AI): ${errorMsg}. Cek Token Anda.`
        };
    }
}

module.exports = puterImg2Img;