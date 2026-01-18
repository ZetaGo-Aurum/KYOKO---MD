const YouTubeDownloader = require('../../src/scraper/youtube')

const pluginConfig = {
    name: 'ytmp4',
    alias: ['ytvideo', 'youtubemp4', 'ytvid', 'ytv', 'video', 'yt4', 'ytvideo'],
    category: 'download',
    description: 'Download video YouTube MP4',
    usage: '.ytmp4 <url>',
    example: '.ytmp4 https://youtu.be/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim().split(/\s+/)[0]
    
    if (!url) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  🎬 *YTMP4*          ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Download video YouTube\n\n` +
            `┌──「 *USAGE* 」\n` +
            `│ ${m.prefix}ytmp4 <url>\n` +
            `└────────────────\n\n` +
            `┌──「 *EXAMPLE* 」\n` +
            `│ ${m.prefix}ytmp4 https://youtu.be/xxx\n` +
            `│ ${m.prefix}ytvid https://youtube.com/shorts/xxx\n` +
            `└────────────────\n\n` +
            `*Aliases:* .yt4, .ytvid, .ytv`
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
        `> Mengunduh video...\n` +
        `> Mohon tunggu 30-60 detik`
    )
    
    try {
        const result = await downloader.downloadVideo(url)
        
        if (!result.success || !result.buffer) {
            return m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ❌ *FAILED*         ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Gagal mengunduh video\n` +
                `> Coba lagi nanti`
            )
        }
        
        const title = (result.title || 'YouTube Video').slice(0, 100)
        
        await sock.sendMessage(m.chat, {
            video: result.buffer,
            caption: 
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ✅ *DOWNLOADED*     ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> 📛 *Title:* ${title}\n` +
                `> 📺 *Quality:* ${result.format || 'HD'}\n\n` +
                `> _KYOKO MD v2.0_`
        }, { quoted: m })
        
    } catch (err) {
        console.error('[ytmp4] Error:', err.message)
        await m.reply(
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
