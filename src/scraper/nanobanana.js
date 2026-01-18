const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

/**
 * TRUE IMAGE-TO-IMAGE Transformation using Stability AI API
 * - Uses init_image parameter for reference image
 * - Uses image_strength parameter to control preservation of original
 * - Requires STABILITY_API_KEY in .env (free credits available)
 * 
 * Get your FREE API key at: https://platform.stability.ai/account/keys
 * (25 free credits for new users)
 */

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;

/**
 * TRUE Img2Img using Stability AI API
 * @param {Buffer} imageBuffer - Reference image that MUST be preserved
 * @param {string} prompt - Modification prompt (skin color, style, etc)
 * @param {Object} options - Additional options
 * @param {number} options.strength - Image strength 0-1 (higher = more faithful to original, default: 0.65)
 */
async function img2img(imageBuffer, prompt, options = {}) {
    const {
        strength = 0.65, // Higher = more faithful to original image
        negativePrompt = 'blurry, bad quality, distorted, deformed'
    } = options;

    // Check if Stability API key exists
    if (!STABILITY_API_KEY) {
        console.warn('[Stability] No API key found. Get free key at: https://platform.stability.ai/account/keys');
        console.log('[Stability] Falling back to HuggingFace text2img...');
        return await fallbackToHF(prompt);
    }

    console.log(`[Stability] Starting TRUE img2img transformation...`);
    console.log(`[Stability] Strength: ${strength} (higher = more faithful to original)`);
    console.log(`[Stability] Prompt: ${prompt.substring(0, 50)}...`);

    try {
        // Prepare multipart form data
        const formData = new FormData();
        formData.append('init_image', imageBuffer, {
            filename: 'image.png',
            contentType: 'image/png'
        });
        formData.append('init_image_mode', 'IMAGE_STRENGTH');
        formData.append('image_strength', strength.toString());
        formData.append('text_prompts[0][text]', prompt);
        formData.append('text_prompts[0][weight]', '1');
        formData.append('text_prompts[1][text]', negativePrompt);
        formData.append('text_prompts[1][weight]', '-1');
        formData.append('cfg_scale', '7');
        formData.append('samples', '1');
        formData.append('steps', '30');

        console.log('[Stability] Sending to SDXL img2img API...');

        const response = await axios.post(
            'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${STABILITY_API_KEY}`,
                    'Accept': 'application/json'
                },
                timeout: 120000
            }
        );

        if (response.data.artifacts && response.data.artifacts[0]) {
            const base64Image = response.data.artifacts[0].base64;
            console.log('[Stability] ✓ TRUE img2img transformation complete!');
            
            return {
                success: true,
                buffer: Buffer.from(base64Image, 'base64'),
                model: 'SDXL',
                strength: strength
            };
        } else {
            throw new Error('No image returned from API');
        }

    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('[Stability] Error:', errorMsg);
        
        // Fallback to HuggingFace if Stability fails
        if (HF_TOKEN) {
            console.log('[Stability] Falling back to HuggingFace...');
            return await fallbackToHF(prompt);
        }

        return {
            success: false,
            error: `Gagal transformasi: ${errorMsg}`
        };
    }
}

/**
 * Fallback to HuggingFace text2img
 */
async function fallbackToHF(prompt) {
    if (!HF_TOKEN) {
        return { success: false, error: 'No HF_TOKEN in .env' };
    }

    try {
        const response = await axios.post(
            'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
            { inputs: prompt },
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'image/png'
                },
                responseType: 'arraybuffer',
                timeout: 120000
            }
        );

        return {
            success: true,
            buffer: Buffer.from(response.data),
            model: 'SDXL (HF Fallback)',
            note: 'Generated via HuggingFace - not true img2img'
        };
    } catch (error) {
        return {
            success: false,
            error: `HF Fallback failed: ${error.message}`
        };
    }
}

// ============ SPECIALIZED FUNCTIONS ============

/**
 * Transform to BLACK skin - preserves everything else
 */
async function toBlack(imageBuffer) {
    return img2img(imageBuffer, 
        'Transform this exact person to have very dark black ebony African skin tone. Keep exact same facial features, same pose, same clothes, same background, same lighting. Only change skin color to dark black ebony complexion. Photorealistic.',
        { strength: 0.7 } // High strength = very faithful to original
    );
}

/**
 * Transform to WHITE skin - preserves everything else
 */
async function toWhite(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this exact person to have fair white caucasian skin tone. Keep exact same facial features, same pose, same clothes, same background, same lighting. Only change skin color to fair white. Photorealistic.',
        { strength: 0.7 }
    );
}

/**
 * Transform to ANIME style - preserves pose and composition
 */
async function toAnime(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into anime style illustration. Same pose, same composition. Clean anime lineart, big expressive eyes, smooth cel shading. High quality anime art. Masterpiece.',
        { strength: 0.5 } // Lower strength for style transfer
    );
}

/**
 * Transform to CARTOON style
 */
async function toCartoon(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into 3D cartoon illustration style like Disney Pixar. Same pose, same composition. Bright colors, smooth shading, clean render.',
        { strength: 0.5 }
    );
}

/**
 * Transform to MANGA style (black and white)
 */
async function toManga(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into black and white manga style. Same pose. Clean ink lineart, screentone shading, high contrast. Japanese manga panel aesthetic.',
        { strength: 0.45 }
    );
}

/**
 * Transform to CHINESE art style
 */
async function toChinese(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into elegant chinese art style portrait. Soft elegant features, porcelain-like skin. Same pose. Beautiful lighting, asian art aesthetic.',
        { strength: 0.55 }
    );
}

/**
 * Transform to COMIC style
 */
async function toComic(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into western comic book style like Marvel DC. Bold outlines, vibrant colors, dynamic lighting. Same pose and composition.',
        { strength: 0.5 }
    );
}

/**
 * Add HIJAB to person
 */
async function toHijab(imageBuffer) {
    return img2img(imageBuffer,
        'Add an elegant modest hijab covering hair and neck to this person. Keep exact same face, same expression. Photorealistic hijab fashion.',
        { strength: 0.6 }
    );
}

/**
 * Transform to PRESIDENTIAL portrait
 */
async function toPresident(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this person into a formal presidential portrait. Add formal black suit with red tie. Keep exact same face. Professional studio lighting, dignified pose.',
        { strength: 0.55 }
    );
}

// Legacy compatibility
async function puterImg2Img(imageBuffer, prompt) {
    return img2img(imageBuffer, prompt, { strength: 0.65 });
}

// Text-to-image
async function generateImage(prompt, model = 'sdxl') {
    return fallbackToHF(prompt);
}

module.exports = {
    img2img,
    generateImage,
    toBlack,
    toWhite,
    toAnime,
    toCartoon,
    toManga,
    toChinese,
    toComic,
    toHijab,
    toPresident,
    puterImg2Img
};

// Allow direct require
module.exports = Object.assign(puterImg2Img, module.exports);