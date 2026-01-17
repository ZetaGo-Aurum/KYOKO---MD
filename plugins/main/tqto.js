const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'tqto',
    alias: ['thanksto', 'credits', 'kredit'],
    category: 'main',
    description: 'Menampilkan daftar kontributor bot',
    usage: '.tqto',
    example: '.tqto',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const botName = config.bot?.name || 'KYOKO MD'
    const version = config.bot?.version || '2.0.0'
    const developer = config.bot?.developer || 'ZetaGo-Aurum'
    
    const credits = [
        { name: 'ZetaGo-Aurum', role: 'Modifier, Developer, Full Stack Engineer, Designer', icon: '⚡' },
        { name: 'HyuuSATAN', role: 'Owner', icon: '👑' },
        { name: 'Keisya', role: 'Owner', icon: '👑' },
        { name: 'Danzzz', role: 'Designer', icon: '🎨' },
        { name: 'Wileys / Yupra', role: 'Baileys Provider', icon: '📚' },
        { name: 'API Providers', role: 'External Services', icon: '🌐' }
    ]
    
    const specialThanks = [
        'Allah SWT',
        'Semua Tester & Bug Reporter',
        'Komunitas WhatsApp Bot Indonesia'
    ]

    // ═══ KYOKO MD v2 STYLE ═══
    let txt = `\n`
    txt += `┏━━━━━━━━━━━━━━━━━━━━━┓\n`
    txt += `┃   ✨ *CREDITS*          ┃\n`
    txt += `┗━━━━━━━━━━━━━━━━━━━━━┛\n\n`
    
    txt += `┌──「 *CONTRIBUTORS* 」\n`
    credits.forEach((c) => {
        txt += `│ ${c.icon} *${c.name}*\n`
        txt += `│    ↳ ${c.role}\n`
    })
    txt += `└────────────────\n\n`
    
    txt += `┌──「 *SPECIAL THANKS* 」\n`
    specialThanks.forEach((t) => {
        txt += `│ ★ ${t}\n`
    })
    txt += `└────────────────\n\n`
    
    txt += `┌──「 *BOT INFO* 」\n`
    txt += `│ 🤖 *Name:* ${botName}\n`
    txt += `│ 📦 *Version:* v${version}\n`
    txt += `│ 👨‍💻 *Dev:* ${developer}\n`
    txt += `└────────────────\n\n`
    
    txt += `> _Made with ❤️ by the team_`
    
    const saluranId = config.saluran?.id || ''
    const saluranName = config.saluran?.name || botName
    const saluranLink = config.saluran?.link || ''
    
    let thumbPath = path.join(process.cwd(), 'assets', 'images', 'kyoko.jpg')
    if (!fs.existsSync(thumbPath)) {
        thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg')
    }
    let thumbBuffer = null
    if (fs.existsSync(thumbPath)) {
        thumbBuffer = fs.readFileSync(thumbPath)
    }
    
    const contextInfo = {
        mentionedJid: [],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: `✨ KYOKO MD Credits`,
            body: `v${version} • Made by ZetaGo-Aurum`,
            sourceUrl: saluranLink,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: true
        }
    }
    
    if (thumbBuffer) {
        contextInfo.externalAdReply.thumbnail = thumbBuffer
    }
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: contextInfo
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
