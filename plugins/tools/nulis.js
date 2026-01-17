const Jimp = require('jimp')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'nulis',
    alias: ['tulis', 'write'],
    category: 'tools',
    description: 'Generate tulisan tangan di kertas',
    usage: '$nulis <teks>',
    example: '$nulis Aku cinta kamu selamanya',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args?.join(' ')
    
    if (!text) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  📝 *NULIS*           ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Buat tulisan tangan otomatis\n\n` +
            `┌──「 *USAGE* 」\n` +
            `│ ${m.prefix}nulis <teks>\n` +
            `└────────────────\n\n` +
            `┌──「 *EXAMPLE* 」\n` +
            `│ ${m.prefix}nulis Aku cinta kamu\n` +
            `└────────────────`
        )
    }
    
    if (text.length > 500) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ❌ *ERROR*           ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Teks terlalu panjang!\n` +
            `> Maksimal: 500 karakter`
        )
    }
    
    await m.react('⏳')
    await m.reply(
        `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
        `┃  ⏳ *PROCESSING*     ┃\n` +
        `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
        `> Membuat tulisan tangan...`
    )
    
    try {
        const inputPath = path.join(process.cwd(), 'assets', 'kertas', 'magernulis1.jpg')
        const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Zahraaa.ttf')
        
        if (!fs.existsSync(inputPath)) {
            return m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ❌ *MISSING FILE*    ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Template tidak ditemukan\n` +
                `> Path: assets/kertas/magernulis1.jpg`
            )
        }
        
        // Load image
        const image = await Jimp.read(inputPath)
        
        // Load font - use Jimp built-in fonts since custom fonts require extra setup
        const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK)
        
        const d = new Date()
        const tgl = d.toLocaleDateString('id-ID')
        const hari = d.toLocaleDateString('id-ID', { weekday: 'long' })
        
        // Print date info (top right area)
        image.print(font, 806, 78, hari)
        image.print(font, 806, 102, tgl)
        
        // Print main text with word wrap
        // Position: x=344, y=142, max width ~400
        const maxWidth = 400
        const maxHeight = 500
        
        image.print(
            font,
            344,
            142,
            {
                text: text,
                alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
                alignmentY: Jimp.VERTICAL_ALIGN_TOP
            },
            maxWidth,
            maxHeight
        )
        
        // Get buffer
        const buffer = await image.getBufferAsync(Jimp.MIME_JPEG)
        
        await m.react('✅')
        
        const saluranId = config.saluran?.id || ''
        const saluranName = config.saluran?.name || 'KYOKO MD'
        
        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: 
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ✅ *SUCCESS*        ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Tulisan tangan berhasil dibuat!\n` +
                `> Hati-hati ketahuan ya 📖\n\n` +
                `> _KYOKO MD v2.0_`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
    } catch (err) {
        console.error('[nulis] Error:', err.message)
        await m.react('❌')
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
