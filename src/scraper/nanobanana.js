const axios = require('axios');

/**
 * Puter AI Wrapper
 * Reverse-engineered from https://js.puter.com/v2/
 */
async function puterImg2Img(imageBuffer, prompt) {
    try {
        // 1. Convert Buffer to Base64
        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg'; // Assuming JPEG input for simplicity, or detect logic

        // 2. Prepare Payload
        // Based on puter.js: puter.ai.txt2img maps to driver call with "input_image"
        const payload = {
            "interface": "puter-ai-2",
            "method": "txt2img",
            "args": {
                "prompt": prompt,
                "input_image": base64Image,
                "input_image_mime_type": mimeType,
                "model": "gemini-2.5-flash-latest" // As requested: 2.5 flash
            }
        };

        // 3. Get Anonymous Token (if needed) or Try Direct Call
        // Puter API often works with a simple guest logic or specific headers.
        // We act as the JS client.
        
        // Note: Direct API URL for drivers
        const apiUrl = 'https://api.puter.com/drivers/call';
        
        console.log('[Puter] Sending request to:', apiUrl);

        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://puter.com',
                'Referer': 'https://puter.com/'
            },
            timeout: 120000 // 2 mins timeout
        });

        // 4. Handle Response
        // Puter returns an object, usually with a standard result structure
        // The image might be a URL or Base64 in the response
        
        if (response.data && response.data.result) {
            const resultData = response.data.result;
            
            // Result is commonly a base64 data URI or a URL
            if (typeof resultData === 'string') {
                if (resultData.startsWith('data:image')) {
                     // Check base64 format
                     return {
                        success: true,
                        buffer: Buffer.from(resultData.split(',')[1], 'base64')
                     };
                } else if (resultData.startsWith('http')) {
                    // It's a URL
                    const imgRes = await axios.get(resultData, { responseType: 'arraybuffer' });
                    return {
                        success: true,
                        buffer: Buffer.from(imgRes.data)
                    };
                } else {
                    // Raw base64?
                    try {
                        return {
                             success: true,
                             buffer: Buffer.from(resultData, 'base64')
                        };
                    } catch (e) {
                         // ignore
                    }
                }
            } else if (resultData.url) {
                 const imgRes = await axios.get(resultData.url, { responseType: 'arraybuffer' });
                 return { success: true, buffer: Buffer.from(imgRes.data) };
            }
        }
        
        // Try to handle specific "image_element" or similar return if object
        console.log('[Puter] Response:', JSON.stringify(response.data).substring(0, 200));
        
        if (response.data?.success === false) {
             throw new Error(response.data?.error?.message || 'API request failed');
        }

        throw new Error('Invalid response format from Puter AI');

    } catch (error) {
        console.error('[Puter] Error:', error.message);
        if (error.response) {
             console.error('[Puter] Status:', error.response.status);
             console.error('[Puter] Data:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}

module.exports = puterImg2Img;