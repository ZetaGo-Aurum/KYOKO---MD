const axios = require('axios');
require('dotenv').config();

/**
 * TRUE IMAGE-TO-IMAGE Transformation using Prodia API
 * - Uses reference image as init_image
 * - Low denoising_strength (0.25-0.35) to preserve original image
 * - Prompt only modifies specific aspects
 * 
 * This ensures the output looks like the INPUT image with modifications,
 * NOT a completely new generated image.
 */

const HF_TOKEN = process.env.HF_TOKEN;
const PRODIA_API_KEY = process.env.PRODIA_API_KEY; // Optional, for higher limits

// Prodia API endpoints
const PRODIA_BASE = 'https://api.prodia.com/v1';

// Models available for img2img
const MODELS = {
    'sdxl': 'sdxl',
    'sd15': 'deliberate_v3.safetensors [afd9d2d364]',
    'realistic': 'realisticVisionV51_v51VAE.safetensors [15012c538f]',
    'anime': 'anythingV5_PrtRE.safetensors [893e49b9a9]',
    'dreamshaper': 'dreamshaper_8.safetensors [9d40847d09]'
};

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
 * TRUE Img2Img using Prodia API
 * @param {Buffer} imageBuffer - Reference image that MUST be preserved
 * @param {string} prompt - Modification prompt (skin color, style, etc)
 * @param {Object} options - Additional options
 * @param {string} options.model - Model to use (default: 'realistic')
 * @param {number} options.strength - Denoising strength 0-1 (lower = more faithful to original, default: 0.3)
 * @param {string} options.negativePrompt - What to avoid
 */
async function img2img(imageBuffer, prompt, options = {}) {
    const {
        model = 'realistic',
        strength = 0.3, // LOW strength = HIGH fidelity to original
        negativePrompt = 'blurry, bad quality, distorted, deformed, ugly'
    } = options;

    console.log(`[Prodia] Starting TRUE img2img transformation...`);
    console.log(`[Prodia] Strength: ${strength} (lower = more faithful to original)`);
    console.log(`[Prodia] Prompt: ${prompt.substring(0, 50)}...`);

    try {
        // 1. Upload reference image to get URL
        console.log('[Prodia] Uploading reference image...');
        const imageUrl = await uploadToTempHost(imageBuffer);
        console.log('[Prodia] Image URL:', imageUrl.substring(0, 50) + '...');

        // 2. Call Prodia img2img API
        const selectedModel = MODELS[model] || MODELS['realistic'];
        
        const jobResponse = await axios.post(`${PRODIA_BASE}/sd/transform`, {
            imageUrl: imageUrl,
            prompt: prompt,
            negative_prompt: negativePrompt,
            model: selectedModel,
            denoising_strength: strength,
            steps: 25,
            cfg_scale: 7,
            sampler: 'DPM++ 2M Karras',
            width: 512,
            height: 512
        }, {
            headers: {
                'X-Prodia-Key': PRODIA_API_KEY || 'guest',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        const jobId = jobResponse.data.job;
        console.log(`[Prodia] Job created: ${jobId}`);

        // 3. Poll for completion
        let result = null;
        let attempts = 0;
        const maxAttempts = 60; // Max 2 minutes

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
            
            const statusResponse = await axios.get(`${PRODIA_BASE}/job/${jobId}`, {
                headers: {
                    'X-Prodia-Key': PRODIA_API_KEY || 'guest',
                    'Accept': 'application/json'
                }
            });

            const status = statusResponse.data.status;
            
            if (status === 'succeeded') {
                result = statusResponse.data;
                break;
            } else if (status === 'failed') {
                throw new Error('Prodia job failed: ' + (statusResponse.data.error || 'Unknown error'));
            }
            
            attempts++;
            console.log(`[Prodia] Status: ${status} (attempt ${attempts}/${maxAttempts})`);
        }

        if (!result) {
            throw new Error('Prodia job timed out');
        }

        // 4. Download result image
        const imageResponse = await axios.get(result.imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        console.log('[Prodia] ✓ Transformation complete!');

        return {
            success: true,
            buffer: Buffer.from(imageResponse.data),
            model: model,
            strength: strength
        };

    } catch (error) {
        console.error('[Prodia] Error:', error.message);
        
        // Fallback to HuggingFace text2img if Prodia fails
        if (HF_TOKEN) {
            console.log('[Prodia] Falling back to HuggingFace...');
            return await fallbackToHF(prompt, model);
        }

        return {
            success: false,
            error: `Gagal transformasi: ${error.message}`
        };
    }
}

/**
 * Fallback to HuggingFace text2img (NOT recommended for img2img)
 */
async function fallbackToHF(prompt, model) {
    const HF_MODELS = {
        'sdxl': 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
        'anime': 'https://router.huggingface.co/hf-inference/models/stablediffusionapi/anything-v5',
        'realistic': 'https://router.huggingface.co/hf-inference/models/Lykon/dreamshaper-8'
    };

    const modelUrl = HF_MODELS[model] || HF_MODELS['sdxl'];

    try {
        const response = await axios.post(modelUrl, {
            inputs: prompt,
            parameters: {
                negative_prompt: 'blurry, bad quality',
                num_inference_steps: 30,
                guidance_scale: 7.5
            }
        }, {
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'image/png'
            },
            responseType: 'arraybuffer',
            timeout: 120000
        });

        return {
            success: true,
            buffer: Buffer.from(response.data),
            model: model,
            note: 'Generated via HuggingFace (fallback - not true img2img)'
        };
    } catch (error) {
        return {
            success: false,
            error: `Fallback juga gagal: ${error.message}`
        };
    }
}

// ============ SPECIALIZED FUNCTIONS ============

/**
 * Transform to BLACK skin - preserves everything else
 */
async function toBlack(imageBuffer) {
    return img2img(imageBuffer, 
        'same person with very dark black ebony African skin tone, same pose, same clothes, same background, photorealistic',
        { model: 'realistic', strength: 0.35 }
    );
}

/**
 * Transform to WHITE skin - preserves everything else
 */
async function toWhite(imageBuffer) {
    return img2img(imageBuffer,
        'same person with fair white caucasian skin tone, same pose, same clothes, same background, photorealistic',
        { model: 'realistic', strength: 0.35 }
    );
}

/**
 * Transform to ANIME style - preserves pose and composition
 */
async function toAnime(imageBuffer) {
    return img2img(imageBuffer,
        'anime style illustration, same pose, same composition, clean lineart, high quality anime',
        { model: 'anime', strength: 0.45 }
    );
}

/**
 * Transform to CARTOON style
 */
async function toCartoon(imageBuffer) {
    return img2img(imageBuffer,
        'cartoon illustration, disney pixar style, same pose, same composition, bright colors',
        { model: 'dreamshaper', strength: 0.45 }
    );
}

/**
 * Transform to MANGA style (black and white)
 */
async function toManga(imageBuffer) {
    return img2img(imageBuffer,
        'black and white manga style, clean ink lineart, screentone shading, same pose',
        { model: 'anime', strength: 0.5 }
    );
}

/**
 * Transform to CHINESE art style
 */
async function toChinese(imageBuffer) {
    return img2img(imageBuffer,
        'chinese art style, soft elegant features, porcelain skin, asian beauty, same pose',
        { model: 'realistic', strength: 0.4 }
    );
}

/**
 * Transform to COMIC style
 */
async function toComic(imageBuffer) {
    return img2img(imageBuffer,
        'western comic book style, bold outlines, vibrant colors, dynamic lighting, same pose',
        { model: 'dreamshaper', strength: 0.45 }
    );
}

/**
 * Add HIJAB to person
 */
async function toHijab(imageBuffer) {
    return img2img(imageBuffer,
        'wearing elegant modest hijab covering hair, same face, same pose, photorealistic',
        { model: 'realistic', strength: 0.4 }
    );
}

/**
 * Transform to PRESIDENTIAL portrait
 */
async function toPresident(imageBuffer) {
    return img2img(imageBuffer,
        'formal presidential portrait, black suit red tie, dignified expression, studio lighting, same face',
        { model: 'realistic', strength: 0.4 }
    );
}

// Legacy compatibility
async function puterImg2Img(imageBuffer, prompt) {
    return img2img(imageBuffer, prompt, { model: 'realistic', strength: 0.35 });
}

// Text-to-image (for txt2img.js plugin)
async function generateImage(prompt, model = 'sdxl') {
    if (!HF_TOKEN) {
        return { success: false, error: 'HF_TOKEN tidak ditemukan di .env' };
    }

    const HF_MODELS = {
        'sdxl': 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
        'anime': 'https://router.huggingface.co/hf-inference/models/stablediffusionapi/anything-v5',
        'dreamshaper': 'https://router.huggingface.co/hf-inference/models/Lykon/dreamshaper-8'
    };

    const modelUrl = HF_MODELS[model] || HF_MODELS['sdxl'];

    try {
        const response = await axios.post(modelUrl, {
            inputs: prompt
        }, {
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'image/png'
            },
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