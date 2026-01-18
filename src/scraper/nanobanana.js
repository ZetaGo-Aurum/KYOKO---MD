const axios = require('axios');
const fs = require('fs');

/**
 * Use Puter AI for Image-to-Image transformation
 * DIRECT API IMPLEMENTATION (removes unstable @heyputer/puter.js library dependency)
 * 
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {string} prompt - Prompt for transformation
 * @returns {Promise<Object>} Result object { success: boolean, buffer?: Buffer, error?: string }
 */
async function puterImg2Img(imageBuffer, prompt) {
    try {
        // console.log('[Puter] Processing Img2Img with Gemini 2.5 Flash (Direct API)...'); // Reduced logging

        if (!process.env.PUTER_TOKEN) {
            console.warn('[Puter] Warning: PUTER_TOKEN is missing. Using Pollinations AI Fallback.');
            return await pollinationsImg2Img(imageBuffer, prompt);
        }

        const base64Image = imageBuffer.toString('base64');
        const apiUrl = 'https://api.puter.com/drivers/call';
        
        const payload = {
            "interface": "puter-ai-2",
            "method": "txt2img",
            "args": {
                "prompt": prompt,
                "input_image": base64Image,
                "input_image_mime_type": "image/jpeg",
                "model": "gemini-2.5-flash-latest"
            }
        };

        const headers = {
            'Content-Type': 'application/json',
            'Origin': 'https://puter.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Authorization': `Bearer ${process.env.PUTER_TOKEN}`
        };

        const response = await axios.post(apiUrl, payload, { 
            headers, 
            timeout: 120000 // Extended timeout for AI processing
        });

        const resultData = response.data?.result;

        if (!resultData) {
            throw new Error('No result returned from API');
        }

        // Handle Base64 Data URI result
        if (typeof resultData === 'string' && resultData.startsWith('data:image')) {
             const base64Data = resultData.split(',')[1];
             return {
                success: true,
                buffer: Buffer.from(base64Data, 'base64')
             };
        }
        
        // Handle URL result
        let url = resultData;
        if (typeof resultData === 'object' && resultData.url) {
            url = resultData.url;
        } else if (typeof resultData === 'object' && resultData.src) {
            url = resultData.src;
        }
        
        if (typeof url === 'string' && url.startsWith('http')) {
            const imgRes = await axios.get(url, { 
                responseType: 'arraybuffer',
                timeout: 30000
            });
            return { success: true, buffer: Buffer.from(imgRes.data) };    
        }

        console.error('[Puter] Unknown response format:', typeof resultData, resultData);
        throw new Error('Format response API tidak dikenali');

    } catch (error) {
        console.error('[Puter] API Error:', error.message);
        
        // Handle specific 401 error
        if (error.response?.status === 401) {
            return { 
                success: false, 
                error: 'Token Puter.js Expired/Invalid. Cek kembali PUTER_TOKEN di .env' 
            };
        }
        
        return { 
            success: false, 
            error: `Gagal proses AI: ${error.message}` 
        };
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