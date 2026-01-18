const fs = require('fs');

/**
 * Use Puter AI for Image-to-Image transformation
 * Uses the installed @heyputer/puter.js library
 * Lazy-loaded to prevent startup crashes
 */
async function puterImg2Img(imageBuffer, prompt) {
    let puter;
    
    // Lazy load Puter.js
    try {
        console.log('[Puter] Lazy loading library...');
        
        // Try standard require first
        try {
            const puterLib = require('@heyputer/puter.js');
            if (puterLib.init) {
                puter = puterLib.init(process.env.PUTER_TOKEN);
            } else {
                puter = new puterLib(process.env.PUTER_TOKEN); 
            }
        } catch (e1) {
            // Fallback to specific path
            try {
                const { init } = require('@heyputer/puter.js/src/init.cjs');
                puter = init(process.env.PUTER_TOKEN);
            } catch (e2) {
                // If standard import fails, try to reverse engineer API call manually to avoid crash
                console.warn('[Puter] Library load failed, using Axios fallback');
                return await puterImg2ImgFallback(imageBuffer, prompt);
            }
        }
    } catch (error) {
        console.error('[Puter] Library init failed:', error.message);
        return { success: false, error: 'Gagal memuat library AI' };
    }

    if (!puter) {
        // Double check fallback
        return await puterImg2ImgFallback(imageBuffer, prompt);
    }

    if (!process.env.PUTER_TOKEN) {
        console.warn('[Puter] Warning: PUTER_TOKEN is missing in .env');
    }

    try {
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
            const axios = require('axios');
            const imgRes = await axios.get(src, { responseType: 'arraybuffer' });
            return {
                success: true,
                buffer: Buffer.from(imgRes.data)
            };
        } else {
            throw new Error('Unknown output format');
        }

    } catch (error) {
        console.error('[Puter] Error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Fallback implementation using direct API calls if library fails
 * This mimics what puter.js does but without the library overhead/bugs
 */
async function puterImg2ImgFallback(imageBuffer, prompt) {
    const axios = require('axios');
    try {
        console.log('[Puter] Using Fallback API implementation');
        
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
            'User-Agent': 'Mozilla/5.0' // Generic agent
        };

        if (process.env.PUTER_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.PUTER_TOKEN}`;
        }

        const response = await axios.post(apiUrl, payload, { headers, timeout: 60000 });
        const resultData = response.data?.result;

        if (typeof resultData === 'string' && resultData.startsWith('data:image')) {
             return {
                success: true,
                buffer: Buffer.from(resultData.split(',')[1], 'base64')
             };
        }
        
        // Handle URL result
        let url = resultData;
        if (typeof resultData === 'object' && resultData.url) url = resultData.url;
        
        if (typeof url === 'string' && url.startsWith('http')) {
            const imgRes = await axios.get(url, { responseType: 'arraybuffer' });
            return { success: true, buffer: Buffer.from(imgRes.data) };    
        }

        throw new Error('Invalid fallback response');

    } catch (error) {
        console.error('[Puter] Fallback Error:', error.message);
        return { success: false, error: 'Fallback AI Failed: ' + error.message };
    }
}

module.exports = puterImg2Img;