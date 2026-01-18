const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'counterfeit',
    alias: ['cf', 'counterfeit3', 'cfv3', 'animerealistic'],
    category: 'ai',
    description: 'Generate gambar anime realistic dengan Counterfeit model',
    usage: '.counterfeit <prompt> | <negative prompt>',
    example: '.counterfeit 1girl, detailed face, beautiful | lowres',
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
    let negative = parts[2] || 'EasyNegative, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality'
    
    if (detail) {
        positive = `${positive}, ${detail}`
    }
    
    positive = `(masterpiece, best quality, high quality:1.2), ${positive}`
    
    return { positive, negative }
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `💎 *ᴄᴏᴜɴᴛᴇʀꜰᴇɪᴛ*\n\n` +
            `> Generate gambar anime realistic\n\n` +
            `*Format:*\n` +
            `\`${m.prefix}cf <prompt> | <detail> | <negative>\`\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}cf 1girl, detailed eyes, beautiful\`\n` +
            `\`${m.prefix}counterfeit anime girl, long hair | soft lighting\`\n\n` +
            `*Aliases:* .cf, .cfv3, .animerealistic`
        )
    }
    
    await m.react('💎')
    await m.reply(`⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ...*\n\n> Model: Counterfeit V3\n> _Mohon tunggu 30-60 detik..._`)
    
    try {
        const { positive, negative } = parsePrompt(text)
        
        console.log(`[Counterfeit] Prompt: ${positive.substring(0, 50)}...`)
        
        const result = await nanobanana.generateImage(positive, 'anime')
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat generate gambar'}`)
        }
        
        await m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `💎 *ᴄᴏᴜɴᴛᴇʀꜰᴇɪᴛ*\n\n` +
                `> _Prompt: ${positive.substring(0, 100)}_\n` +
                `> _Model: ${result.model}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[Counterfeit] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
