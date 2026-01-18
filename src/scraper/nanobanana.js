const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

/**
 * TRUE IMAGE-TO-IMAGE Multi-Provider System
 * 
 * PROVIDERS BY CREDITS:
 * 1. Stability AI - UNLIMITED (Community License for <$1M revenue orgs)
 * 2. Getimg.ai - 40 FREE credits/day
 * 3. Clipdrop - 100 FREE credits/month
 * 4. HuggingFace - Fallback text2img (not true img2img but works)
 * 
 * Get API keys:
 * - Stability: https://platform.stability.ai/account/keys (UNLIMITED Community License)
 * - Getimg: https://getimg.ai/tools/api (40/day free)
 * - Clipdrop: https://clipdrop.co/apis (100/month free)
 */

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const GETIMG_API_KEY = process.env.GETIMG_API_KEY;
const CLIPDROP_API_KEY = process.env.CLIPDROP_API_KEY;
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
        throw new Error('Failed to upload image');
    }
    return imageUrl;
}

// ============ PROVIDER 1: STABILITY AI (UNLIMITED) ============
async function stabilityImg2Img(imageBuffer, prompt, strength = 0.65) {
    if (!STABILITY_API_KEY) return null;

    console.log('[Stability] Using Stability AI (UNLIMITED Community License)...');

    try {
        const formData = new FormData();
        formData.append('init_image', imageBuffer, { filename: 'image.png', contentType: 'image/png' });
        formData.append('init_image_mode', 'IMAGE_STRENGTH');
        formData.append('image_strength', strength.toString());
        formData.append('text_prompts[0][text]', prompt);
        formData.append('text_prompts[0][weight]', '1');
        formData.append('cfg_scale', '7');
        formData.append('samples', '1');
        formData.append('steps', '30');

        const response = await axios.post(
            'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
            formData,
            {
                headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${STABILITY_API_KEY}`, 'Accept': 'application/json' },
                timeout: 120000
            }
        );

        if (response.data.artifacts?.[0]) {
            console.log('[Stability] ✓ Success!');
            return Buffer.from(response.data.artifacts[0].base64, 'base64');
        }
    } catch (error) {
        console.error('[Stability] Error:', error.response?.data?.message || error.message);
    }
    return null;
}

// ============ PROVIDER 2: GETIMG.AI (40/day FREE) ============
async function getimgImg2Img(imageBuffer, prompt, strength = 0.65) {
    if (!GETIMG_API_KEY) return null;

    console.log('[Getimg] Using Getimg.ai (40 FREE/day)...');

    try {
        const base64Image = imageBuffer.toString('base64');

        const response = await axios.post('https://api.getimg.ai/v1/stable-diffusion-xl/image-to-image', {
            model: 'stable-diffusion-xl-v1-0',
            prompt: prompt,
            negative_prompt: 'blurry, bad quality, distorted',
            image: base64Image,
            strength: 1 - strength, // Getimg uses inverse (lower = more faithful)
            steps: 30,
            guidance: 7.5,
            output_format: 'png'
        }, {
            headers: { 'Authorization': `Bearer ${GETIMG_API_KEY}`, 'Content-Type': 'application/json' },
            timeout: 120000
        });

        if (response.data.image) {
            console.log('[Getimg] ✓ Success!');
            return Buffer.from(response.data.image, 'base64');
        }
    } catch (error) {
        console.error('[Getimg] Error:', error.response?.data?.error || error.message);
    }
    return null;
}

// ============ PROVIDER 3: CLIPDROP (100/month FREE) ============
async function clipdropImg2Img(imageBuffer, prompt) {
    if (!CLIPDROP_API_KEY) return null;

    console.log('[Clipdrop] Using Clipdrop (100 FREE/month)...');

    try {
        const formData = new FormData();
        formData.append('image_file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
        formData.append('prompt', prompt);

        const response = await axios.post('https://clipdrop-api.co/replace-background/v1', formData, {
            headers: { ...formData.getHeaders(), 'x-api-key': CLIPDROP_API_KEY },
            responseType: 'arraybuffer',
            timeout: 60000
        });

        console.log('[Clipdrop] ✓ Success!');
        return Buffer.from(response.data);
    } catch (error) {
        console.error('[Clipdrop] Error:', error.message);
    }
    return null;
}

// ============ PROVIDER 4: HUGGINGFACE (Fallback) ============
async function hfTextToImage(prompt) {
    if (!HF_TOKEN) return null;

    console.log('[HuggingFace] Fallback text2img (not true img2img)...');

    try {
        const response = await axios.post(
            'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
            { inputs: prompt },
            {
                headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json', 'Accept': 'image/png' },
                responseType: 'arraybuffer',
                timeout: 120000
            }
        );

        console.log('[HuggingFace] ✓ Success!');
        return Buffer.from(response.data);
    } catch (error) {
        console.error('[HuggingFace] Error:', error.message);
    }
    return null;
}

/**
 * MAIN FUNCTION: Try all providers in order
 */
async function img2img(imageBuffer, prompt, options = {}) {
    const { strength = 0.65 } = options;
    let result = null;
    let provider = 'none';

    console.log(`[Nanobanana] Starting TRUE img2img with strength ${strength}...`);
    console.log(`[Nanobanana] Prompt: ${prompt.substring(0, 60)}...`);

    // Try providers in order of generosity
    result = await stabilityImg2Img(imageBuffer, prompt, strength);
    if (result) { provider = 'Stability AI (UNLIMITED)'; }

    if (!result) {
        result = await getimgImg2Img(imageBuffer, prompt, strength);
        if (result) { provider = 'Getimg.ai (40/day)'; }
    }

    if (!result) {
        result = await clipdropImg2Img(imageBuffer, prompt);
        if (result) { provider = 'Clipdrop (100/month)'; }
    }

    if (!result) {
        result = await hfTextToImage(prompt);
        if (result) { provider = 'HuggingFace (fallback)'; }
    }

    if (result) {
        return { success: true, buffer: result, model: provider, strength };
    }

    return {
        success: false,
        error: 'Semua provider gagal. Pastikan minimal satu API key ada di .env:\n' +
               '• STABILITY_API_KEY (UNLIMITED - https://platform.stability.ai)\n' +
               '• GETIMG_API_KEY (40/day - https://getimg.ai)\n' +
               '• CLIPDROP_API_KEY (100/month - https://clipdrop.co)\n' +
               '• HF_TOKEN (fallback - https://huggingface.co)'
    };
}

// ============ SPECIALIZED FUNCTIONS ============

async function toBlack(imageBuffer) {
    return img2img(imageBuffer, 
        'Transform this exact person to have very dark black ebony African skin tone. Keep exact same facial features, same pose, same clothes, same background. Only change skin color.',
        { strength: 0.7 }
    );
}

async function toWhite(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this exact person to have fair white caucasian skin tone. Keep exact same facial features, same pose, same clothes, same background. Only change skin color.',
        { strength: 0.7 }
    );
}

async function toAnime(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into anime style illustration. Same pose, same composition. Clean anime lineart, big expressive eyes.',
        { strength: 0.5 }
    );
}

async function toCartoon(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into 3D cartoon illustration style like Disney Pixar. Same pose, bright colors.',
        { strength: 0.5 }
    );
}

async function toManga(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into black and white manga style. Clean ink lineart, screentone shading.',
        { strength: 0.45 }
    );
}

async function toChinese(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into elegant chinese art style portrait. Soft features, porcelain skin.',
        { strength: 0.55 }
    );
}

async function toComic(imageBuffer) {
    return img2img(imageBuffer,
        'Transform this image into western comic book style like Marvel DC. Bold outlines, vibrant colors.',
        { strength: 0.5 }
    );
}

async function toHijab(imageBuffer) {
    return img2img(imageBuffer,
        'Add an elegant modest hijab covering hair and neck. Keep exact same face, same expression.',
        { strength: 0.6 }
    );
}

async function toPresident(imageBuffer) {
    return img2img(imageBuffer,
        'Transform into formal presidential portrait. Add formal black suit with red tie. Keep same face.',
        { strength: 0.55 }
    );
}

async function puterImg2Img(imageBuffer, prompt) {
    return img2img(imageBuffer, prompt, { strength: 0.65 });
}

/**
 * Generate Image from text prompt with style/model routing
 * @param {string} prompt - Text prompt
 * @param {string} style - Model style: anime, sdxl, dreamshaper, etc.
 */
async function generateImage(prompt, style = 'default') {
    let result = null;
    let modelUsed = 'unknown';
    
    // Model routing based on style
    const modelMap = {
        'anime': 'anything-v5',
        'sdxl': 'stable-diffusion-xl-v1-0',
        'dreamshaper': 'dreamshaper-8',
        'counterfeit': 'counterfeit-v3',
        'meinamix': 'meinamix-v11',
        'default': 'stable-diffusion-xl-v1-0'
    };
    
    const selectedModel = modelMap[style] || modelMap['default'];
    console.log(`[Nanobanana] Generating with style: ${style}, model: ${selectedModel}`);
    
    // Try Getimg.ai first (40 credits/day) - supports model selection
    if (GETIMG_API_KEY) {
        try {
            console.log('[Getimg] Generating with Getimg.ai...');
            
            const response = await axios.post('https://api.getimg.ai/v1/stable-diffusion/text-to-image', {
                model: selectedModel,
                prompt: prompt,
                negative_prompt: 'lowres, bad anatomy, text, error, worst quality, low quality',
                width: 1024,
                height: 1024,
                steps: 30,
                guidance: 7.5,
                output_format: 'png'
            }, {
                headers: { 'Authorization': `Bearer ${GETIMG_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 120000
            });
            
            if (response.data?.image) {
                result = Buffer.from(response.data.image, 'base64');
                modelUsed = `Getimg (${selectedModel})`;
                console.log('[Getimg] ✓ Success!');
            }
        } catch (error) {
            console.error('[Getimg] Text2Img Error:', error.response?.data?.error || error.message);
        }
    }
    
    // Fallback to HuggingFace
    if (!result && HF_TOKEN) {
        result = await hfTextToImage(prompt);
        if (result) modelUsed = 'HuggingFace SDXL';
    }
    
    if (result) {
        return { success: true, buffer: result, model: modelUsed };
    }
    
    return { 
        success: false, 
        error: 'Gagal generate gambar. Pastikan GETIMG_API_KEY atau HF_TOKEN ada di .env' 
    };
}

module.exports = {
    img2img, generateImage,
    toBlack, toWhite, toAnime, toCartoon, toManga, toChinese, toComic, toHijab, toPresident,
    puterImg2Img
};