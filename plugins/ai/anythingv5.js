const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'anythingv5',
    alias: ['av5', 'anything', 'anythingv5', 'anime', 'waifu'],
    category: 'ai',
    description: 'Generate gambar anime dengan Anything V5 model',
    usage: '.anythingv5 <prompt> | <negative prompt>',
    example: '.anythingv5 1girl, blue hair, detailed eyes | lowres, bad anatomy',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

/**
 * Parse prompt with format:
 * <character/positive> | <detail/lora> | <negative>
 */
function parsePrompt(text) {
    const parts = text.split('|').map(p => p.trim())
    
    let positive = parts[0] || ''
    let detail = parts[1] || ''
    let negative = parts[2] || 'lowres, bad anatomy, bad hands, text, error, missing fingers, cropped, worst quality, low quality, jpeg artifacts, signature, watermark, blurry'
    
    // Combine positive with detail
    if (detail) {
        positive = `${positive}, ${detail}`
    }
    
    // Add anime quality tags
    positive = `masterpiece, best quality, anime style, ${positive}`
    
    return { positive, negative }
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `🎨 *ᴀɴʏᴛʜɪɴɢ ᴠ5*\n\n` +
            `> Generate gambar anime\n\n` +
            `*Format:*\n` +
            `\`${m.prefix}av5 <prompt> | <detail> | <negative>\`\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}av5 1girl, blue hair, school uniform\`\n` +
            `\`${m.prefix}av5 catgirl, cute | detailed eyes, soft lighting | lowres\`\n\n` +
            `*Aliases:* .anime, .waifu, .anything`
        )
    }
    
    await m.react('🎨')
    await m.reply(`⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ...*\n\n> Model: Anything V5\n> _Mohon tunggu 30-60 detik..._`)
    
    try {
        const { positive, negative } = parsePrompt(text)
        
        console.log(`[AnythingV5] Prompt: ${positive.substring(0, 50)}...`)
        
        const result = await nanobanana.generateImage(positive, 'anime')
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat generate gambar'}`)
        }
        
        await m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🎨 *ᴀɴʏᴛʜɪɴɢ ᴠ5*\n\n` +
                `> _Prompt: ${positive.substring(0, 100)}_\n` +
                `> _Model: ${result.model}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[AnythingV5] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
