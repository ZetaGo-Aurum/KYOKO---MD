const gemini = require('../../src/scraper/gemini')

const pluginConfig = {
    name: 'gemini',
    alias: ['gemini3', 'geminiflash', 'ai'],
    category: 'ai',
    description: 'Chat dengan Google Gemini AI',
    usage: '.gemini <pertanyaan>',
    example: '.gemini Hai apa kabar?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`✨ *ɢᴇᴍɪɴɪ ᴀɪ*\n\n> Chat dengan AI powered by Google\n\n\`Contoh: ${m.prefix}gemini Hai apa kabar?\``)
    }
    
    await m.react('✨')
    
    try {
        const result = await gemini({ message: text })
        
        if (!result?.text) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ada respon dari AI`)
        }
        
        await m.react('✅')
        await m.reply(`✨ *ɢᴇᴍɪɴɪ ᴀɪ*\n\n${result.text}`)
        
    } catch (error) {
        await m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
