const primbon = require('@bochilteam/scraper-primbon')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'nomorhoki',
    alias: ['nomerhoki', 'ceknomor', 'hpkoki'],
    category: 'primbon',
    description: 'Cek keberuntungan nomor HP',
    usage: '.nomorhoki <nomor>',
    example: '.nomorhoki 6281234567890',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
}

let thumbPrimbon = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-games.jpg')
    if (fs.existsSync(thumbPath)) thumbPrimbon = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '🍀 *ɴᴏᴍᴏʀ ʜᴏᴋɪ*', body = 'Primbon') {
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

async function handler(m, { sock }) {
    let nomor = m.args?.[0]
    
    if (!nomor) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}nomorhoki <nomor>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}nomorhoki 6281234567890\`\n\n` +
            `> *Note:* Gunakan format 62`
        )
    }
    
    nomor = nomor.replace(/[^0-9]/g, '')
    
    if (nomor.length < 10 || nomor.length > 15) {
        return m.reply(`❌ *ɴᴏᴍᴏʀ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Masukkan nomor HP yang valid`)
    }
    
    await m.react('⏳')
    await m.reply(`⏳ *ᴍᴇɴɢᴇᴄᴇᴋ ᴋᴇʙᴇʀᴜɴᴛᴜɴɢᴀɴ...*`)
    
    try {
        const result = await primbon.nomorhoki(parseInt(nomor))
        
        if (!result) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat mengecek nomor ini`)
        }
        
        const text = `🍀 *ɴᴏᴍᴏʀ ʜᴏᴋɪ*\n\n` +
            `> Nomor: \`${nomor}\`\n\n` +
            `╭┈┈⬡「 ✨ *ᴇɴᴇʀɢɪ ᴘᴏsɪᴛɪғ* 」\n` +
            `┃ 💰 Kekayaan: ${result.angka_kekayaan_i || result.angka_kekayaan || '-'}%\n` +
            `┃ ❤️ Cinta: ${result.angka_cinta_i || result.angka_cinta || '-'}%\n` +
            `┃ 🏥 Kesehatan: ${result.angka_kesehatan_i || result.angka_kesehatan || '-'}%\n` +
            `┃ ⚖️ Kestabilan: ${result.angka_kestabilan_i || result.angka_kestabilan || '-'}%\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 ⚠️ *ᴇɴᴇʀɢɪ ɴᴇɢᴀᴛɪғ* 」\n` +
            `┃ 😤 Perselisihan: ${result.angka_perselissatisfaan_i || '-'}%\n` +
            `┃ 📉 Kehilangan: ${result.angka_kehilangan_i || '-'}%\n` +
            `┃ ☠️ Malapetaka: ${result.angka_malapetaka_i || '-'}%\n` +
            `┃ 💥 Kehancuran: ${result.angka_kehancuran_i || '-'}%\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        
        await m.react('✅')
        await sock.sendMessage(m.chat, {
            text: text,
            contextInfo: getContextInfo('🍀 *ɴᴏᴍᴏʀ ʜᴏᴋɪ*', nomor)
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
