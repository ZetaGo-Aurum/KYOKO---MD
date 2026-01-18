const fs = require('fs');

// Attempt to load Puter.js
let puter;
try {
    // Try standard require first
    // Note: The user mentioned '@heyputer/puter.js/src/init.cjs' but standard import should be preferred if main is set
    // We'll try standard first, then fallback to deep import if needed
    try {
        const puterLib = require('@heyputer/puter.js');
        // Check if init exists on default export or named export
        if (puterLib.init) {
            puter = puterLib.init(process.env.PUTER_TOKEN);
        } else {
            // Might be a default export class/function
            puter = new puterLib(process.env.PUTER_TOKEN); 
        }
    } catch (e1) {
        // Fallback to specific path as user suggested
        // Using dynamic require to avoid errors if path is wrong during static analysis
        const { init } = require('@heyputer/puter.js/src/init.cjs');
        puter = init(process.env.PUTER_TOKEN);
    }
} catch (error) {
    console.error('[Puter] Library load failed:', error.message);
}

/**
 * Use Puter AI for Image-to-Image transformation
 * Uses the installed @heyputer/puter.js library
 */
async function puterImg2Img(imageBuffer, prompt) {
    if (!puter) {
        return { success: false, error: 'Library @heyputer/puter.js gagal dimuat' };
    }

    if (!process.env.PUTER_TOKEN) {
        console.warn('[Puter] Warning: PUTER_TOKEN is missing in .env');
        // We continue, hoping for free tier or detailed error
    }

    try {
        console.log('[Puter] Processing Img2Img with Gemini 2.5 Flash...');

        // Convert Buffer to Base64
        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg'; 

        // Call Puter AI
        // Using prompt + image options
        // According to docs/usage, we use txt2img with input_image for img2img tasks
        const imageElement = await puter.ai.txt2img(prompt, {
            input_image: base64Image,
            input_image_mime_type: mimeType,
            model: 'gemini-2.5-flash-latest' // As requested
        });

        // The result 'imageElement' is typically an HTML Image Element in browser,
        // but in Node.js it returns an object with src (URL or Base64)
        
        // Log the keys to debug structure if needed
        // console.log('[Puter] Result Keys:', Object.keys(imageElement));

        let src = imageElement.src || imageElement.url;
        
        if (!src && typeof imageElement === 'string') {
            src = imageElement;
        }

        if (!src) {
             // Sometimes it returns the element itself with a 'src' property
             throw new Error('No image source returned from Puter AI');
        }

        // Process output
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
            throw new Error('Unknown output format: ' + src.substring(0, 50));
        }

    } catch (error) {
        console.error('[Puter] Error:', error.message);
        if (error.message.includes('401') || error.message.includes('token')) {
            return { 
                success: false, 
                error: 'Token Puter.js Invalid/Missing. Harap set PUTER_TOKEN di .env' 
            };
        }
        return { success: false, error: error.message };
    }
}

module.exports = puterImg2Img;