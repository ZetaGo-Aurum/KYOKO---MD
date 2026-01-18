const { geminiVision } = require('./gemini')

/**
 * Image to Prompt - Describe an image using AI
 * Uses Gemini Vision API
 */

require('dotenv').config()

async function img2prompt(imageBuffer) {
    try {
        if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
            throw new Error('Image buffer required')
        }

        console.log('[Img2Prompt] Using Gemini Vision...')
        
        const result = await geminiVision(
            imageBuffer, 
            'Describe this image in detail. Include the main subjects, art style, colors, composition, and mood. Format the description as a prompt that could be used to generate a similar image.'
        )

        if (result?.text) {
            console.log('[Img2Prompt] ✓ Success')
            return {
                success: true,
                prompt: result.text
            }
        }

        throw new Error('No description generated')

    } catch (e) {
        // Fallback to simple description request
        return { 
            success: false, 
            error: e.message 
        }
    }
}

module.exports = img2prompt
