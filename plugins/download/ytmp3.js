const YouTubeDownloader = require('../../src/scraper/youtube')

const pluginConfig = {
    name: 'ytmp3',
    alias: ['ytaudio', 'youtubemp3', 'ytaud', 'yta', 'audio', 'yt3', 'mp3', 'ytmusic'],
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
            `└────────────────\n\n` +
            `*Aliases:* .yt3, .yta, .mp3, .ytmusic`
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
        `┃  ⏳ *DOWNLOADING*    ┃\n` +
        `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
        `> Mengunduh audio...\n` +
        `> Mohon tunggu 30-60 detik`
    )
    
    try {
        const result = await downloader.downloadAudio(url)
        
        if (!result.success || !result.buffer) {
            return m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ❌ *FAILED*         ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Gagal mengunduh audio\n` +
                `> Coba lagi nanti`
            )
        }
        
        const filename = (result.title || 'youtube_audio').replace(/[<>:"/\\|?*]/g, '').slice(0, 100)
        
        await sock.sendMessage(m.chat, {
            audio: result.buffer,
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
