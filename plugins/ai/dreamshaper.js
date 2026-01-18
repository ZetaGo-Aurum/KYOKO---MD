const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'dreamshaper',
    alias: ['ds', 'dream', 'ds8', 'dreamshaper8', 'artistic'],
    category: 'ai',
    description: 'Generate gambar artistic dengan DreamShaper model',
    usage: '.dreamshaper <prompt> | <negative prompt>',
    example: '.dreamshaper fantasy landscape, magical | blur',
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
    let negative = parts[2] || 'lowres, bad anatomy, text, error, cropped, worst quality, low quality, jpeg artifacts, watermark'
    
    if (detail) {
        positive = `${positive}, ${detail}`
    }
    
    positive = `masterpiece, best quality, highly detailed, ${positive}`
    
    return { positive, negative }
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `🌙 *ᴅʀᴇᴀᴍsʜᴀᴘᴇʀ*\n\n` +
            `> Generate gambar artistic\n\n` +
            `*Format:*\n` +
            `\`${m.prefix}ds <prompt> | <detail> | <negative>\`\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}ds fantasy castle in the clouds\`\n` +
            `\`${m.prefix}dream beautiful girl, flowers | soft lighting | ugly\`\n\n` +
            `*Aliases:* .ds, .dream, .artistic`
        )
    }
    
    await m.react('🌙')
    await m.reply(`⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ...*\n\n> Model: DreamShaper 8\n> _Mohon tunggu 30-60 detik..._`)
    
    try {
        const { positive, negative } = parsePrompt(text)
        
        console.log(`[DreamShaper] Prompt: ${positive.substring(0, 50)}...`)
        
        const result = await nanobanana.generateImage(positive, 'dreamshaper')
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat generate gambar'}`)
        }
        
        await m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🌙 *ᴅʀᴇᴀᴍsʜᴀᴘᴇʀ*\n\n` +
                `> _Prompt: ${positive.substring(0, 100)}_\n` +
                `> _Model: ${result.model}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[DreamShaper] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
