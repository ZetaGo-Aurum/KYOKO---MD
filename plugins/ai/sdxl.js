const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'sdxl',
    alias: ['sd', 'stablediffusion', 'sdxl10', 'xl', 'realistic'],
    category: 'ai',
    description: 'Generate gambar photorealistic dengan SDXL model',
    usage: '.sdxl <prompt> | <negative prompt>',
    example: '.sdxl beautiful landscape, mountains | blurry, lowres',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

function parsePrompt(text) {
    const parts = text.split('|').map(p => p.trim())
    
    let positive = parts[0] || ''
    let detail = parts[1] || ''
    let negative = parts[2] || 'lowres, bad anatomy, text, error, cropped, worst quality, low quality, jpeg artifacts, watermark, blurry'
    
    if (detail) {
        positive = `${positive}, ${detail}`
    }
    
    positive = `masterpiece, best quality, highly detailed, photorealistic, ${positive}`
    
    return { positive, negative }
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `🖼️ *sᴅxʟ*\n\n` +
            `> Generate gambar photorealistic\n\n` +
            `*Format:*\n` +
            `\`${m.prefix}sdxl <prompt> | <detail> | <negative>\`\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}sdxl beautiful sunset over ocean\`\n` +
            `\`${m.prefix}sd portrait of a woman | professional photo | ugly\`\n\n` +
            `*Aliases:* .sd, .realistic, .xl`
        )
    }
    
    await m.react('🖼️')
    await m.reply(`⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ...*\n\n> Model: SDXL 1.0\n> _Mohon tunggu 30-60 detik..._`)
    
    try {
        const { positive, negative } = parsePrompt(text)
        
        console.log(`[SDXL] Prompt: ${positive.substring(0, 50)}...`)
        
        const result = await nanobanana.generateImage(positive, 'sdxl')
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat generate gambar'}`)
        }
        
        await m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🖼️ *sᴅxʟ*\n\n` +
                `> _Prompt: ${positive.substring(0, 100)}_\n` +
                `> _Model: ${result.model}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[SDXL] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
