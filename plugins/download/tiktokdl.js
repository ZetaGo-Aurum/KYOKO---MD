const { downloadTikTok } = require('../../src/scraper/tiktok')

const pluginConfig = {
    name: 'tiktokdl',
    alias: ['ttdown', 'tt', 'tiktok'],
    category: 'download',
    description: 'Download video TikTok tanpa watermark',
    usage: '.tiktokdl <url>',
    example: '.tiktokdl https://vt.tiktok.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  🎵 *TIKTOK DL*        ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Download video TikTok\n\n` +
            `┌──「 *USAGE* 」\n` +
            `│ ${m.prefix}tiktokdl <url>\n` +
            `└────────────────\n\n` +
            `┌──「 *EXAMPLE* 」\n` +
            `│ ${m.prefix}tiktokdl https://vt.tiktok.com/xxx\n` +
            `└────────────────`
        )
    }
    
    if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ❌ *INVALID URL*    ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Gunakan link TikTok yang valid`
        )
    }
    
    await m.reply(
        `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
        `┃  ⏳ *PROCESSING*     ┃\n` +
        `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
        `> Mengunduh video...`
    )
    
    try {
        const result = await downloadTikTok(url)
        
        if (!result?.success || !result?.videoUrl) {
            return m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ❌ *FAILED*         ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Gagal mengambil video\n` +
                `> Coba link lain`
            )
        }
        
        const stats = result.stats || {}
        const author = result.author || {}
        
        let caption = `\n┏━━━━━━━━━━━━━━━━━━┓\n`
        caption += `┃  ✅ *TIKTOK DL*       ┃\n`
        caption += `┗━━━━━━━━━━━━━━━━━━┛\n\n`
        caption += `> 📝 *${(result.title || 'TikTok Video').slice(0, 80)}*\n\n`
        
        if (author.name) caption += `> 👤 *Author:* ${author.name}${author.username ? ` (@${author.username})` : ''}\n`
        if (stats.play) caption += `> ▶️ *Views:* ${stats.play}\n`
        if (stats.like) caption += `> ❤️ *Likes:* ${stats.like}\n`
        if (stats.comment) caption += `> 💬 *Comments:* ${stats.comment}\n`
        
        caption += `\n> _KYOKO MD v2.0_`
        
        await sock.sendMessage(m.chat, {
            video: { url: result.videoUrl },
            caption: caption.trim()
        }, { quoted: m })
        
    } catch (err) {
        console.error('[tiktokdl] Error:', err.message)
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
