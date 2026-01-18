const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Gemini AI Chat - Using Official Google AI SDK
 * Supports text chat and conversation history
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini
let genAI = null;
let model = null;

function initGemini() {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY tidak ditemukan di .env');
    }
    if (!genAI) {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
    return model;
}

/**
 * Simple text generation
 */
async function gemini({ message, instruction = '', sessionId = null }) {
    try {
        if (!message) throw new Error('Message is required.');
        
        const geminiModel = initGemini();
        
        // Build prompt with instruction if provided
        let fullPrompt = message;
        if (instruction) {
            fullPrompt = `${instruction}\n\nUser: ${message}`;
        }
        
        // Generate response
        const result = await geminiModel.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        return {
            text: text,
            sessionId: null // Simplified - no session management for now
        };
        
    } catch (error) {
        throw new Error(`Gemini Error: ${error.message}`);
    }
}

/**
 * Chat with history (for conversation continuity)
 */
async function geminiChat(messages, instruction = '') {
    try {
        const geminiModel = initGemini();
        
        // Convert messages to Gemini format
        const history = messages.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        
        const chat = geminiModel.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 2048,
            },
        });
        
        // Get last message
        const lastMessage = messages[messages.length - 1];
        let prompt = lastMessage.content;
        if (instruction) {
            prompt = `${instruction}\n\n${prompt}`;
        }
        
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        
        return {
            text: response.text(),
            role: 'assistant'
        };
        
    } catch (error) {
        throw new Error(`Gemini Chat Error: ${error.message}`);
    }
}

/**
 * Vision - Analyze image
 */
async function geminiVision(imageBuffer, prompt = 'Describe this image in detail') {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY tidak ditemukan di .env');
        }
        
        const genAIVision = new GoogleGenerativeAI(GEMINI_API_KEY);
        const visionModel = genAIVision.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64');
        
        const result = await visionModel.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            }
        ]);
        
        const response = await result.response;
        return {
            text: response.text(),
            success: true
        };
        
    } catch (error) {
        throw new Error(`Gemini Vision Error: ${error.message}`);
    }
}

module.exports = gemini;
module.exports.gemini = gemini;
module.exports.geminiChat = geminiChat;
module.exports.geminiVision = geminiVision;