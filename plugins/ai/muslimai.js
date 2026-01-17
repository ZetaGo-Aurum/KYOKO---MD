const axios = require('axios')

const pluginConfig = {
    name: 'muslimai',
    alias: ['islamai', 'quranai'],
    category: 'ai',
    description: 'Tanya jawab tentang Islam dengan AI',
    usage: '.muslimai <pertanyaan>',
    example: '.muslimai Apa hukum sholat?',
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
        return m.reply(`🕌 *ᴍᴜsʟɪᴍ ᴀɪ*\n\n> Tanya tentang Islam\n\n\`Contoh: ${m.prefix}muslimai Apa hukum sholat?\``)
    }
    
    m.react('🕌')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/muslimai?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        const answer = data.result?.answer || data.result
        let sources = data.result?.source || []
        
        let caption = `🕌 *ᴍᴜsʟɪᴍ ᴀɪ*\n\n${answer}`
        
        if (sources.length > 0) {
            caption += `\n\n📖 *sᴜᴍʙᴇʀ*\n`
            sources.slice(0, 3).forEach((src, i) => {
                caption += `> ${i + 1}. \`${src.surah_title || 'Quran'}\`\n`
            })
        }
        
        m.react('✅')
        await m.reply(caption)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
