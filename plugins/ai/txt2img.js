const nanobanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'txt2img',
    alias: ['imagine', 'generate', 'genimg'],
    category: 'ai',
    description: 'Generate gambar dari teks menggunakan AI',
    usage: '.txt2img <prompt>',
    example: '.txt2img beautiful sunset over mountains',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ')
    if (!prompt) {
        return m.reply(`🎨 *ᴛxᴛ2ɪᴍɢ*\n\n> Generate gambar dari teks\n\n\`Contoh: ${m.prefix}txt2img beautiful anime girl with blue hair\``)
    }
    
    await m.react('🎨')
    await m.reply(`⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ...*\n\n> Prompt: ${prompt.substring(0, 50)}...`)
    
    try {
        const result = await nanobanana.generateImage(prompt)
        
        if (!result.success || !result.buffer) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error || 'Tidak dapat generate gambar'}`)
        }
        
        await m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: result.buffer,
            caption: `🎨 *ᴛxᴛ2ɪᴍɢ*\n\n> _Model: ${result.model}_\n> _Prompt: ${prompt.substring(0, 100)}_`
        }, { quoted: m })
        
    } catch (error) {
        console.error('[txt2img] Error:', error)
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
