const YouTubeDownloader = require('../../src/scraper/youtube')
const axios = require('axios')

const pluginConfig = {
    name: 'ytmp3',
    alias: ['ytaudio', 'youtubemp3', 'ytaud', 'yta', 'audio', 'yt3', 'mp3'],
    category: 'download',
    description: 'Download audio YouTube MP3',
    usage: '.ytmp3 <url>',
    example: '.ytmp3 https://youtu.be/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

async function downloadBuffer(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    return Buffer.from(response.data)
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  🎵 *YTMP3*          ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Download audio YouTube\n\n` +
            `┌──「 *USAGE* 」\n` +
            `│ ${m.prefix}ytmp3 <url>\n` +
            `└────────────────\n\n` +
            `┌──「 *EXAMPLE* 」\n` +
            `│ ${m.prefix}ytmp3 https://youtu.be/xxx\n` +
            `│ ${m.prefix}yta https://youtube.com/watch?v=xxx\n` +
            `└────────────────`
        )
    }
    
    const downloader = new YouTubeDownloader()
    
    if (!downloader.validateURL(url)) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ❌ *INVALID URL*    ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Gunakan link YouTube yang valid`
        )
    }
    
    await m.reply(
        `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
        `┃  ⏳ *PROCESSING*     ┃\n` +
        `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
        `> Mengunduh audio...\n` +
        `> Mohon tunggu sebentar`
    )
    
    try {
        const result = await downloader.downloadAudio(url)
        
        if (!result.success || !result.url) {
            return m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ❌ *FAILED*         ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Gagal mengunduh audio\n` +
                `> Coba lagi nanti`
            )
        }
        
        const filename = (result.title || 'youtube_audio').replace(/[<>:"/\\|?*]/g, '').slice(0, 100)
        
        // Download as buffer first to avoid ENOENT
        console.log('[ytmp3] Downloading audio buffer...')
        const audioBuffer = await downloadBuffer(result.url)
        
        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${filename}.mp3`
        }, { quoted: m })
        
    } catch (err) {
        console.error('[ytmp3] Error:', err.message)
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ❌ *ERROR*          ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> ${err.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
