const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'meinamix',
    alias: ['meina', 'meinav11', 'mm', 'semirealistic'],
    category: 'ai',
    description: 'Generate gambar semi-realistic dengan MeinaMix model',
    usage: '.meinamix <prompt> | <negative prompt>',
    example: '.meinamix beautiful asian girl, elegant | lowres',
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
    let negative = parts[2] || 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality'
    
    if (detail) {
        positive = `${positive}, ${detail}`
    }
    
    positive = `masterpiece, best quality, highres, absurdres, ${positive}`
    
    return { positive, negative }
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `✨ *ᴍᴇɪɴᴀᴍɪx*\n\n` +
            `> Generate gambar semi-realistic\n\n` +
            `*Format:*\n` +
            `\`${m.prefix}meina <prompt> | <detail> | <negative>\`\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}meina beautiful asian girl, elegant dress\`\n` +
            `\`${m.prefix}mm 1girl, long hair | soft lighting | ugly\`\n\n` +
            `*Aliases:* .meina, .mm, .semirealistic`
        )
    }
    
    await m.react('✨')
    await m.reply(`⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ...*\n\n> Model: MeinaMix V11\n> _Mohon tunggu 30-60 detik..._`)
    
    try {
        const { positive, negative } = parsePrompt(text)
        
        console.log(`[MeinaMix] Prompt: ${positive.substring(0, 50)}...`)
        
        const result = await nanobanana.generateImage(positive, 'sdxl')
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat generate gambar'}`)
        }
        
        await m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `✨ *ᴍᴇɪɴᴀᴍɪx*\n\n` +
                `> _Prompt: ${positive.substring(0, 100)}_\n` +
                `> _Model: ${result.model}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[MeinaMix] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
