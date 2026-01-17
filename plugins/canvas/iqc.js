const axios = require('axios')

const pluginConfig = {
    name: 'iqc',
    alias: ['iqchat'],
    category: 'canvas',
    description: 'Membuat gambar chat iPhone style',
    usage: '.iqc <text>',
    example: '.iqc Hai cantik',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> Masukkan teks untuk chat\n\n\`Contoh: ${m.prefix}iqc Hai cantik\``)
    }
    
    m.react('📱')
    
    try {
        const now = new Date()
        const chatTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const statusTime = `${now.getHours().toString().padStart(2, '0')}:${(now.getMinutes() + 1).toString().padStart(2, '0')}`
        
        const url = `https://api.deline.web.id/maker/iqc?text=${encodeURIComponent(text)}&chatTime=${encodeURIComponent(chatTime)}&statusBarTime=${encodeURIComponent(statusTime)}`
        
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> \`${text}\``
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
