const { pinterest } = require('btch-downloader')

const pluginConfig = {
    name: 'pins',
    alias: ['pinsearch', 'pinterestsearch'],
    category: 'search',
    description: 'Cari gambar random di Pinterest',
    usage: '.pins <query>',
    example: '.pins Zhao Lusi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}pins <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}pins Zhao Lusi\``
        )
    }
    
    await m.reply(`🔍 *ᴍᴇɴᴄᴀʀɪ:* ${query}...`)
    
    try {
        const data = await pinterest(query)
        
        if (!data?.result?.result?.result || data.result.result.result.length === 0) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const results = data.result.result.result
        const randomIndex = Math.floor(Math.random() * results.length)
        const item = results[randomIndex]
        
        const imageUrl = item.image_url || item.images?.orig?.url || item.images?.['736x']?.url
        
        if (!imageUrl) {
            return m.reply(`❌ Gambar tidak ditemukan.`)
        }
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `🔍 *ᴘɪɴᴛᴇʀᴇsᴛ sᴇᴀʀᴄʜ*\n\n` +
                `> 🔎 Query: *${query}*\n` +
                `> 📛 ${item.title || 'Pinterest'}\n` +
                `> 👤 ${item.uploader?.full_name || 'Unknown'}`
        }, { quoted: m })
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
