const { spawn, exec } = require('child_process')
const config = require('../../config')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const execAsync = promisify(exec)

const pluginConfig = {
    name: 'nulis',
    alias: ['tulis', 'write'],
    category: 'tools',
    description: 'Generate tulisan tangan di kertas',
    usage: '.nulis <teks>',
    example: '.nulis Aku cinta kamu selamanya',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

// Check if ImageMagick is available
let hasImageMagick = false
async function checkImageMagick() {
    try {
        await execAsync('convert -version')
        hasImageMagick = true
    } catch (e) {
        hasImageMagick = false
    }
}
checkImageMagick()

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
    
    // Check ImageMagick first
    if (!hasImageMagick) {
        await checkImageMagick()
        if (!hasImageMagick) {
            return m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ⚠️ *REQUIREMENT*    ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> ImageMagick tidak terinstall\n\n` +
                `┌──「 *INSTALL* 」\n` +
                `│ Ubuntu/Debian:\n` +
                `│ \`apt install imagemagick\`\n` +
                `│\n` +
                `│ Pterodactyl:\n` +
                `│ Fitur ini tidak tersedia\n` +
                `└────────────────`
            )
        }
    }
    
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Zahraaa.ttf')
    const inputPath = path.join(process.cwd(), 'assets', 'kertas', 'magernulis1.jpg')
    
    if (!fs.existsSync(fontPath)) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ❌ *MISSING FILE*    ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Font tidak ditemukan\n` +
            `> Path: assets/fonts/Zahraaa.ttf`
        )
    }
    
    if (!fs.existsSync(inputPath)) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ❌ *MISSING FILE*    ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Template tidak ditemukan\n` +
            `> Path: assets/kertas/magernulis1.jpg`
        )
    }
    
    await m.react('⏳')
    await m.reply(
        `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
        `┃  ⏳ *PROCESSING*     ┃\n` +
        `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
        `> Membuat tulisan tangan...`
    )
    
    const d = new Date()
    const tgl = d.toLocaleDateString('id-ID')
    const hari = d.toLocaleDateString('id-ID', { weekday: 'long' })
    
    const bufs = []
    
    const spawnArgs = [
        inputPath,
        '-font', fontPath,
        '-size', '1024x784',
        '-pointsize', '20',
        '-interline-spacing', '1',
        '-annotate', '+806+78', hari,
        '-font', fontPath,
        '-size', '1024x784',
        '-pointsize', '18',
        '-interline-spacing', '1',
        '-annotate', '+806+102', tgl,
        '-font', fontPath,
        '-size', '1024x784',
        '-pointsize', '20',
        '-interline-spacing', '-7.5',
        '-annotate', '+344+142', text,
        'jpg:-'
    ]
    
    return new Promise((resolve, reject) => {
        const process = spawn('convert', spawnArgs)
        
        process.stdout.on('data', chunk => bufs.push(chunk))
        
        process.stderr.on('data', (data) => {
            console.log('[nulis] stderr:', data.toString())
        })
        
        process.on('error', async (e) => {
            await m.react('❌')
            await m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ❌ *FAILED*         ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> ImageMagick error\n` +
                `> ${e.message}`
            )
            reject(e)
        })
        
        process.on('close', async (code) => {
            if (code !== 0 || bufs.length === 0) {
                await m.react('❌')
                await m.reply(
                    `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                    `┃  ❌ *FAILED*         ┃\n` +
                    `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                    `> Gagal generate tulisan`
                )
                return reject(new Error('Process failed'))
            }
            
            await m.react('✅')
            
            const saluranId = config.saluran?.id || ''
            const saluranName = config.saluran?.name || 'KYOKO MD'
            
            await sock.sendMessage(m.chat, {
                image: Buffer.concat(bufs),
                caption: 
                    `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                    `┃  ✅ *SUCCESS*        ┃\n` +
                    `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                    `> Tulisan tangan berhasil dibuat!\n` +
                    `> Hati-hati ketahuan ya 📖`,
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
            
            resolve()
        })
    }).catch(() => {})
}

module.exports = {
    config: pluginConfig,
    handler
}
