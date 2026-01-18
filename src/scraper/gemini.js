const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

/**
 * Gemini AI Chat - Using Official Google AI SDK
 * With fallback to free AI APIs when quota exceeded
 * 
 * Uses gemini-1.5-flash for FREE TIER (higher quota than 2.0)
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Available models with different quotas
const MODELS = [
    'gemini-1.5-flash',      // Best free tier quota
    'gemini-1.5-flash-8b',   // Even lower usage
    'gemini-2.0-flash-lite'  // Lite version
];

let currentModelIndex = 0;

/**
 * Get next model if quota exceeded
 */
function getNextModel() {
    currentModelIndex = (currentModelIndex + 1) % MODELS.length;
    return MODELS[currentModelIndex];
}

/**
 * Simple text generation with model rotation on quota error
 */
async function gemini({ message, instruction = '', sessionId = null }) {
    try {
        if (!message) throw new Error('Message is required.');
        
        // Build prompt
        let fullPrompt = message;
        if (instruction) {
            fullPrompt = `${instruction}\n\nUser: ${message}`;
        }
        
        // Try Gemini API first
        if (GEMINI_API_KEY) {
            for (let attempt = 0; attempt < MODELS.length; attempt++) {
                try {
                    const modelName = MODELS[(currentModelIndex + attempt) % MODELS.length];
                    console.log(`[Gemini] Trying model: ${modelName}...`);
                    
                    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    
                    const result = await model.generateContent(fullPrompt);
                    const response = await result.response;
                    const text = response.text();
                    
                    console.log(`[Gemini] ✓ Success with ${modelName}`);
                    return { text, sessionId: null };
                    
                } catch (error) {
                    if (error.message.includes('429') || error.message.includes('quota')) {
                        console.log(`[Gemini] Quota exceeded, trying next model...`);
                        continue;
                    }
                    throw error;
                }
            }
        }
        
        // Fallback to free AI APIs
        console.log('[Gemini] All models quota exceeded, trying fallback APIs...');
        return await fallbackAI(fullPrompt);
        
    } catch (error) {
        // Try fallback on any error
        console.log(`[Gemini] Error: ${error.message}, trying fallback...`);
        try {
            return await fallbackAI(message);
        } catch (fallbackError) {
            throw new Error(`Gemini Error: ${error.message}`);
        }
    }
}

/**
 * Fallback to free AI APIs when Gemini quota exceeded
 */
async function fallbackAI(message) {
    const fallbackAPIs = [
        // DeepInfra free tier
        async () => {
            console.log('[Fallback] Trying DeepInfra...');
            const { data } = await axios.post('https://api.deepinfra.com/v1/openai/chat/completions', {
                model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
                messages: [{ role: 'user', content: message }]
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000
            });
            return { text: data.choices[0].message.content };
        },
        
        // Groq free tier
        async () => {
            console.log('[Fallback] Trying Groq...');
            const GROQ_KEY = process.env.GROQ_API_KEY;
            if (!GROQ_KEY) throw new Error('No GROQ_API_KEY');
            
            const { data } = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: message }]
            }, {
                headers: { 
                    'Authorization': `Bearer ${GROQ_KEY}`,
                    'Content-Type': 'application/json' 
                },
                timeout: 60000
            });
            return { text: data.choices[0].message.content };
        },
        
        // NekoLabs API (original)
        async () => {
            console.log('[Fallback] Trying NekoLabs...');
            const { data } = await axios.get(
                `https://api.nekolabs.web.id/txt.gen/gemini/3-flash?text=${encodeURIComponent(message)}`,
                { timeout: 60000 }
            );
            if (data?.success && data?.result) {
                return { text: data.result };
            }
            throw new Error('NekoLabs failed');
        }
    ];
    
    for (const api of fallbackAPIs) {
        try {
            return await api();
        } catch (e) {
            console.log(`[Fallback] Failed: ${e.message}`);
        }
    }
    
    throw new Error('Semua API AI gagal. Tunggu beberapa menit dan coba lagi.');
}

/**
 * Vision - Analyze image
 */
async function geminiVision(imageBuffer, prompt = 'Describe this image in detail') {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY tidak ditemukan di .env');
        }
        
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        // Try different vision models
        const visionModels = ['gemini-1.5-flash', 'gemini-1.5-flash-8b'];
        
        for (const modelName of visionModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const base64Image = imageBuffer.toString('base64');
                
                const result = await model.generateContent([
                    prompt,
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                ]);
                
                const response = await result.response;
                return { text: response.text(), success: true };
                
            } catch (e) {
                if (e.message.includes('429') || e.message.includes('quota')) {
                    continue;
                }
                throw e;
            }
        }
        
        throw new Error('Vision API quota exceeded');
        
    } catch (error) {
        throw new Error(`Gemini Vision Error: ${error.message}`);
    }
}

/**
 * Chat with history
 */
async function geminiChat(messages, instruction = '') {
    const lastMessage = messages[messages.length - 1];
    return gemini({ message: lastMessage.content, instruction });
}

module.exports = gemini;
module.exports.gemini = gemini;
module.exports.geminiChat = geminiChat;
module.exports.geminiVision = geminiVision;