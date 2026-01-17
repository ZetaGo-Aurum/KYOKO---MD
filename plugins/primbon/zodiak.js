const primbon = require('@bochilteam/scraper-primbon')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'zodiak',
    alias: ['zodiac', 'cekzodiak', 'zodiakku'],
    category: 'primbon',
    description: 'Cek zodiak berdasarkan tanggal lahir',
    usage: '.zodiak <tanggal> <bulan>',
    example: '.zodiak 25 12',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

let thumbPrimbon = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-games.jpg')
    if (fs.existsSync(thumbPath)) thumbPrimbon = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '♈ *ᴢᴏᴅɪᴀᴋ*', body = 'Primbon') {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbPrimbon) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbPrimbon,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

const zodiacEmoji = {
    'Aries': '♈',
    'Taurus': '♉',
    'Gemini': '♊',
    'Cancer': '♋',
    'Leo': '♌',
    'Virgo': '♍',
    'Libra': '♎',
    'Scorpio': '♏',
    'Sagittarius': '♐',
    'Capricorn': '♑',
    'Aquarius': '♒',
    'Pisces': '♓'
}

const zodiacInfo = {
    'Aries': { element: 'Api 🔥', planet: 'Mars', sifat: 'Berani, energik, kompetitif' },
    'Taurus': { element: 'Tanah 🌍', planet: 'Venus', sifat: 'Sabar, setia, materialis' },
    'Gemini': { element: 'Udara 💨', planet: 'Mercury', sifat: 'Komunikatif, cerdas, fleksibel' },
    'Cancer': { element: 'Air 💧', planet: 'Bulan', sifat: 'Emosional, protektif, intuitif' },
    'Leo': { element: 'Api 🔥', planet: 'Matahari', sifat: 'Percaya diri, dramatis, pemimpin' },
    'Virgo': { element: 'Tanah 🌍', planet: 'Mercury', sifat: 'Analitis, perfeksionis, praktis' },
    'Libra': { element: 'Udara 💨', planet: 'Venus', sifat: 'Harmonis, diplomatis, romantis' },
    'Scorpio': { element: 'Air 💧', planet: 'Pluto', sifat: 'Intens, misterius, passionate' },
    'Sagittarius': { element: 'Api 🔥', planet: 'Jupiter', sifat: 'Optimis, petualang, filosofis' },
    'Capricorn': { element: 'Tanah 🌍', planet: 'Saturnus', sifat: 'Ambisius, disiplin, realistis' },
    'Aquarius': { element: 'Udara 💨', planet: 'Uranus', sifat: 'Unik, humanitarian, independen' },
    'Pisces': { element: 'Air 💧', planet: 'Neptunus', sifat: 'Intuitif, artistik, empatik' }
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    if (args.length < 2) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}zodiak <tanggal> <bulan>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}zodiak 25 12\` (25 Desember)\n` +
            `> \`${m.prefix}zodiak 1 1\` (1 Januari)`
        )
    }
    
    const date = parseInt(args[0])
    const month = parseInt(args[1])
    
    if (isNaN(date) || isNaN(month) || date < 1 || date > 31 || month < 1 || month > 12) {
        return m.reply(`❌ *ᴛᴀɴɢɢᴀʟ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Masukkan tanggal (1-31) dan bulan (1-12)`)
    }
    
    await m.react('⏳')
    
    try {
        const zodiac = primbon.getZodiac(month, date)
        
        if (!zodiac) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat menentukan zodiak`)
        }
        
        const emoji = zodiacEmoji[zodiac] || '⭐'
        const info = zodiacInfo[zodiac] || { element: '-', planet: '-', sifat: '-' }
        
        const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                           'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        
        const text = `${emoji} *ᴢᴏᴅɪᴀᴋ*\n\n` +
            `> Tanggal: ${date} ${monthNames[month]}\n\n` +
            `╭┈┈⬡「 ⭐ *${zodiac.toUpperCase()}* 」\n` +
            `┃ ${emoji} Zodiak: ${zodiac}\n` +
            `┃ 🌍 Elemen: ${info.element}\n` +
            `┃ 🪐 Planet: ${info.planet}\n` +
            `┃ 💫 Sifat: ${info.sifat}\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        
        await m.react('✅')
        await sock.sendMessage(m.chat, {
            text: text,
            contextInfo: getContextInfo(`${emoji} *${zodiac.toUpperCase()}*`, `${date} ${monthNames[month]}`)
        }, { quoted: m })
        
    } catch (e) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
