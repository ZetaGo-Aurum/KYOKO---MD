const axios = require('axios');
require('dotenv').config();

/**
 * TRUE IMAGE-TO-IMAGE Transformation using Pollinations.ai KONTEXT Model
 * - Uses reference image as init_image via URL parameter
 * - NO API KEY required - completely FREE
 * - KONTEXT model is specifically designed for img2img transformations
 */

const HF_TOKEN = process.env.HF_TOKEN;

/**
 * Upload image to temporary host for URL access
 */
async function uploadToTempHost(imageBuffer) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('userhash', '');
    form.append('fileToUpload', imageBuffer, { filename: 'image.jpg' });

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        timeout: 30000
    });

    const imageUrl = response.data?.trim();
    if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error('Failed to upload image to temp host');
    }
    return imageUrl;
}

/**
 * TRUE Img2Img using Pollinations.ai KONTEXT model
 * @param {Buffer} imageBuffer - Reference image that MUST be preserved
 * @param {string} prompt - Modification prompt (skin color, style, etc)
 * @param {Object} options - Additional options
 */
async function img2img(imageBuffer, prompt, options = {}) {
    const {
        model = 'kontext', // KONTEXT is designed for img2img
        seed = Math.floor(Math.random() * 1000000)
    } = options;

    console.log(`[Pollinations] Starting TRUE img2img transformation...`);
    console.log(`[Pollinations] Model: ${model} (designed for image editing)`);
    console.log(`[Pollinations] Prompt: ${prompt.substring(0, 50)}...`);

    try {
        // 1. Upload reference image to get URL
        console.log('[Pollinations] Uploading reference image...');
        const imageUrl = await uploadToTempHost(imageBuffer);
        console.log('[Pollinations] Image URL:', imageUrl.substring(0, 50) + '...');

        // 2. Construct Pollinations URL with KONTEXT model
        // KONTEXT model uses the image URL in the prompt or as parameter
        const encodedPrompt = encodeURIComponent(prompt);
        const encodedImageUrl = encodeURIComponent(imageUrl);
        
        // Pollinations img2img format with kontext model
        const pollUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImageUrl}&model=${model}&seed=${seed}&width=1024&height=1024&nologo=true`;

        console.log('[Pollinations] Requesting transformation...');
        
        const response = await axios.get(pollUrl, {
            responseType: 'arraybuffer',
            timeout: 120000, // 2 minutes for generation
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log('[Pollinations] ✓ Transformation complete!');

        return {
            success: true,
            buffer: Buffer.from(response.data),
            model: model
        };

    } catch (error) {
        console.error('[Pollinations] Error:', error.message);
        
        return {
            success: false,
            error: `Gagal transformasi: ${error.message}`
        };
    }
}

// ============ SPECIALIZED FUNCTIONS ============

/**
 * Transform to BLACK skin - preserves everything else
 */
async function toBlack(imageBuffer) {
    return img2img(imageBuffer, 
        'Transform this person to have very dark black ebony African skin tone. Keep exact same facial features, same pose, same clothes, same background. Only change skin color to dark black.',
        { model: 'kontext' }
    );
}

/**
 * Transform to WHITE skin - preserves everything else
 */
async function toWhite(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this person to have fair white caucasian skin tone. Keep exact same facial features, same pose, same clothes, same background. Only change skin color to fair white.',
        { model: 'kontext' }
    );
}

/**
 * Transform to ANIME style - preserves pose and composition
 */
async function toAnime(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into anime style illustration. Keep same pose, same composition. Clean anime lineart, big expressive eyes, smooth shading, high quality anime art style.',
        { model: 'kontext' }
    );
}

/**
 * Transform to CARTOON style
 */
async function toCartoon(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into cartoon illustration style like Disney Pixar. Keep same pose, same composition. Bright colors, smooth shading, clean cartoon render.',
        { model: 'kontext' }
    );
}

/**
 * Transform to MANGA style (black and white)
 */
async function toManga(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into black and white manga style. Keep same pose. Clean ink lineart, screentone shading, high contrast, japanese manga panel aesthetic.',
        { model: 'kontext' }
    );
}

/**
 * Transform to CHINESE art style
 */
async function toChinese(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into chinese art style portrait. Soft elegant features, porcelain-like skin. Keep same pose. Asian art style, beautiful lighting.',
        { model: 'kontext' }
    );
}

/**
 * Transform to COMIC style
 */
async function toComic(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into western comic book style like Marvel DC. Bold outlines, vibrant colors, dynamic lighting. Keep same pose and composition.',
        { model: 'kontext' }
    );
}

/**
 * Add HIJAB to person
 */
async function toHijab(imageBuffer) {
    return img2img(imageBuffer,
        'Add an elegant modest hijab covering hair and neck to this person. Keep exact same face, same pose, same expression. Photorealistic hijab.',
        { model: 'kontext' }
    );
}

/**
 * Transform to PRESIDENTIAL portrait
 */
async function toPresident(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this person into a formal presidential portrait. Add black suit with red tie. Keep exact same face. Studio lighting, dignified pose.',
        { model: 'kontext' }
    );
}

// Legacy compatibility
async function puterImg2Img(imageBuffer, prompt) {
    return img2img(imageBuffer, prompt, { model: 'kontext' });
}

// Text-to-image (for txt2img.js plugin)
async function generateImage(prompt, model = 'flux') {
    try {
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(prompt);
        const pollUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&seed=${seed}&width=1024&height=1024&nologo=true`;

        const response = await axios.get(pollUrl, {
            responseType: 'arraybuffer',
            timeout: 120000
        });

        return {
            success: true,
            buffer: Buffer.from(response.data),
            model: model
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    // Core functions
    img2img,
    generateImage,
    
    // Specialized transformations (TRUE img2img)
    toBlack,
    toWhite,
    toAnime,
    toCartoon,
    toManga,
    toChinese,
    toComic,
    toHijab,
    toPresident,
    
    // Legacy
    puterImg2Img
};

// Allow direct require
module.exports = Object.assign(puterImg2Img, module.exports);