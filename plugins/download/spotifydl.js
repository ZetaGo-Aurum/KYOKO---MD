const axios = require('axios')

const pluginConfig = {
    name: 'spotifydl',
    alias: ['spdl', 'spotify-dl'],
    category: 'download',
    description: 'Download lagu dari Spotify',
    usage: '.spdl <url>',
    example: '.spdl https://open.spotify.com/track/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}spdl <url>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}spdl https://open.spotify.com/track/xxx\``
        )
    }
    
    if (!url.match(/open\.spotify\.com\/track/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link Spotify track.`)
    }
    
    try {
        const encodedUrl = encodeURIComponent(url)
        const res = await axios.get(`https://api.nekolabs.web.id/dwn/spotify/v1?url=${encodedUrl}`)
        
        if (!res.data?.success || !res.data?.result) {
            return m.reply(`❌ Gagal mengambil lagu. Coba link lain.`)
        }
        
        const result = res.data.result
        
        if (!result.downloadUrl || result.downloadUrl.includes('undefined')) {
            return m.reply(`❌ Link download tidak tersedia untuk lagu ini.`)
        }
        
        await sock.sendMessage(m.chat, {
            audio: { url: result.downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${result.title}.mp3`
        }, { quoted: m })
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
