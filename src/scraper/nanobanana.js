const axios = require('axios');
require('dotenv').config();

/**
 * Hugging Face Inference API - Multi-Model Image Generation
 * Supports 5 different models for various styles:
 * 1. Anything V5 - Anime style
 * 2. MeinaMix V11 - Anime/Semi-realistic
 * 3. Counterfeit V3.0 - Anime/Illustration
 * 4. DreamShaper 8 - Fantasy/Dreamy style
 * 5. SDXL Base 1.0 - Universal/Photorealistic (Default)
 */

const HF_TOKEN = process.env.HF_TOKEN;

// Model Routes
const MODELS = {
    'anything-v5': 'https://router.huggingface.co/hf-inference/models/stablediffusionapi/anything-v5',
    'meinamix': 'https://router.huggingface.co/hf-inference/models/Meina/MeinaMix_V11',
    'counterfeit': 'https://router.huggingface.co/hf-inference/models/gsdf/Counterfeit-V3.0',
    'dreamshaper': 'https://router.huggingface.co/hf-inference/models/Lykon/dreamshaper-8',
    'sdxl': 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0'
};

// Model descriptions for help/info
const MODEL_INFO = {
    'anything-v5': 'Anime style - Best for anime characters',
    'meinamix': 'Anime/Semi-realistic - Detailed anime art',
    'counterfeit': 'Anime/Illustration - High quality anime illustrations',
    'dreamshaper': 'Fantasy/Dreamy - Creative fantasy art',
    'sdxl': 'Universal - Photorealistic, any subject (DEFAULT)'
};

/**
 * Generate image using Hugging Face Inference API
 * @param {string} prompt - Text prompt for image generation
 * @param {string} modelName - Model to use (default: 'sdxl')
 * @returns {Promise<Object>} Result object { success: boolean, buffer?: Buffer, model?: string, error?: string }
 */
async function generateImage(prompt, modelName = 'sdxl') {
    // Normalize model name
    const normalizedModel = modelName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    // Find matching model or default to SDXL
    let selectedModel = 'sdxl';
    for (const key of Object.keys(MODELS)) {
        if (normalizedModel.includes(key.replace('-', '')) || key.includes(normalizedModel)) {
            selectedModel = key;
            break;
        }
    }
    
    const modelUrl = MODELS[selectedModel];
    
    console.log(`[HuggingFace] Using model: ${selectedModel}`);
    console.log(`[HuggingFace] Prompt: ${prompt.substring(0, 50)}...`);
    
    try {
        const response = await axios.post(modelUrl, {
            inputs: prompt,
            parameters: {
                negative_prompt: 'blurry, bad quality, distorted, ugly, deformed',
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
            timeout: 120000 // 2 minutes timeout for inference
        });
        
        console.log(`[HuggingFace] Success! Generated image with ${selectedModel}`);
        
        return {
            success: true,
            buffer: Buffer.from(response.data),
            model: selectedModel
        };
        
    } catch (error) {
        const errorMsg = error.response?.data 
            ? Buffer.from(error.response.data).toString('utf-8')
            : error.message;
            
        console.error(`[HuggingFace] Error with ${selectedModel}:`, errorMsg);
        
        // If model is loading, try again with backoff
        if (errorMsg.includes('loading') || errorMsg.includes('currently loading')) {
            console.log('[HuggingFace] Model is loading, retrying in 20 seconds...');
            await new Promise(r => setTimeout(r, 20000));
            return generateImage(prompt, modelName); // Retry
        }
        
        // Try fallback to SDXL if other model failed
        if (selectedModel !== 'sdxl') {
            console.log('[HuggingFace] Trying fallback to SDXL...');
            return generateImage(prompt, 'sdxl');
        }
        
        return {
            success: false,
            error: `Gagal generate gambar: ${errorMsg}`
        };
    }
}

/**
 * Anime-style image generation (uses Anything V5)
 */
async function generateAnime(prompt) {
    const enhancedPrompt = `${prompt}, anime style, high quality, detailed, masterpiece`;
    return generateImage(enhancedPrompt, 'anything-v5');
}

/**
 * Semi-realistic anime (uses MeinaMix)
 */
async function generateMeina(prompt) {
    const enhancedPrompt = `${prompt}, detailed, high quality, masterpiece, best quality`;
    return generateImage(enhancedPrompt, 'meinamix');
}

/**
 * Illustration style (uses Counterfeit)
 */
async function generateCounterfeit(prompt) {
    const enhancedPrompt = `${prompt}, illustration, masterpiece, best quality, detailed`;
    return generateImage(enhancedPrompt, 'counterfeit');
}

/**
 * Dreamy/Fantasy style (uses DreamShaper)
 */
async function generateDream(prompt) {
    const enhancedPrompt = `${prompt}, fantasy, dreamy, ethereal, magical, high quality`;
    return generateImage(enhancedPrompt, 'dreamshaper');
}

/**
 * Universal/Photorealistic (uses SDXL - Default)
 */
async function generateUniversal(prompt) {
    const enhancedPrompt = `${prompt}, high quality, detailed, professional`;
    return generateImage(enhancedPrompt, 'sdxl');
}

/**
 * Transform existing image with prompt (Img2Img not directly supported by these endpoints)
 * Workaround: Generate new image based on prompt description
 * @param {Buffer} imageBuffer - Input image (currently unused, kept for compatibility)
 * @param {string} prompt - Transformation prompt
 * @param {string} modelName - Model to use
 */
async function img2img(imageBuffer, prompt, modelName = 'sdxl') {
    // Note: Standard HF Inference API doesn't support img2img directly
    // We generate a new image based on the prompt
    console.log('[HuggingFace] Note: Using text-to-image mode (img2img requires different model setup)');
    return generateImage(prompt, modelName);
}

/**
 * Get list of available models
 */
function getAvailableModels() {
    return MODEL_INFO;
}

// Legacy export for backward compatibility with toblack.js
// This function signature matches the old puterImg2Img
async function puterImg2Img(imageBuffer, prompt) {
    // Uses SDXL (universal) by default for transformation requests
    return img2img(imageBuffer, prompt, 'sdxl');
}

module.exports = {
    // Main functions
    generateImage,
    generateAnime,
    generateMeina,
    generateCounterfeit,
    generateDream,
    generateUniversal,
    img2img,
    getAvailableModels,
    
    // Legacy export (default export for require('./nanobanana'))
    default: puterImg2Img,
    
    // Also export as named for direct require
    puterImg2Img
};

// Allow direct require to work: const nanobanana = require('./nanobanana')
module.exports = Object.assign(puterImg2Img, module.exports);