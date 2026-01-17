const yts = require('yt-search')
const YouTubeDownloader = require('../../src/scraper/youtube')
const { config } = require('../../config')

const pluginConfig = {
    name: 'play',
    alias: ['p', 'playvn'],
    category: 'search',
    description: 'Putar musik dari YouTube',
    usage: '.play <query>',
    example: '.play neffex grateful',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  🎧 *PLAY*           ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Putar musik dari YouTube\n\n` +
            `┌──「 *USAGE* 」\n` +
            `│ ${m.prefix}play <query>\n` +
            `└────────────────\n\n` +
            `┌──「 *EXAMPLE* 」\n` +
            `│ ${m.prefix}play neffex grateful\n` +
            `└────────────────`
        )
    }

    m.react("🎧")
    
    try {
        const search = await yts(query)
        const video = search.videos[0]
        
        if (!video) {
            return m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ❌ *NOT FOUND*      ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Tidak ditemukan: ${query}`
            )
        }
        
        await m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ⏳ *PROCESSING*     ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> 🎵 ${video.title.slice(0, 50)}...\n` +
            `> Mohon tunggu sebentar`
        )
        
        const downloader = new YouTubeDownloader()
        const result = await downloader.downloadAudio(video.url)
        
        if (!result?.success || !result?.url) {
            return m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ❌ *FAILED*         ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Gagal mengunduh audio`
            )
        }
        
        await sock.sendMessage(m.chat, {
            audio: { url: result.url },
            mimetype: 'audio/mp4',
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config?.saluran?.id || '',
                    newsletterName: config?.saluran?.name || 'KYOKO MD',
                },
                externalAdReply: {
                    title: video.title,
                    body: `🎵 ${video.author?.name || 'YouTube'} • KYOKO MD`,
                    thumbnailUrl: video.thumbnail,
                    sourceUrl: video.url,
                    mediaUrl: video.url,
                    mediaType: 2,
                    renderLargerThumbnail: true,
                }
            }
        }, { quoted: m })
        
    } catch (err) {
        console.error('[play] Error:', err.message)
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
