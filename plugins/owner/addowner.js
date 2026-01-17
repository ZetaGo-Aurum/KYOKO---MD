const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addowner',
    alias: ['setowner', 'tambahowner'],
    category: 'owner',
    description: 'Menambahkan owner baru ke bot',
    usage: '.addowner <nomor/@tag/reply>',
    example: '.addowner 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
}

function extractNumber(m) {
    let targetNumber = ''
    
    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    return targetNumber
}

async function handler(m, { sock }) {
    const targetNumber = extractNumber(m)
    
    if (!targetNumber) {
        return m.reply(
            `👑 *ᴀᴅᴅ ᴏᴡɴᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ Reply pesan user\n` +
            `┃ ◦ Tag user @mention\n` +
            `┃ ◦ Ketik nomor langsung\n` +
            `╰┈┈⬡\n\n` +
            `\`Contoh: ${m.prefix}addowner 6281234567890\``
        )
    }
    
    if (targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Format nomor tidak valid`)
    }
    
    const ownerList = config.owner?.number || []
    
    if (ownerList.includes(targetNumber)) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nomor \`${targetNumber}\` sudah menjadi owner`)
    }
    
    config.owner.number.push(targetNumber)
    
    const db = getDatabase()
    db.setting('ownerNumbers', config.owner.number)
    
    m.react('👑')
    
    await m.reply(
        `👑 *ᴏᴡɴᴇʀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📱 ɴᴏᴍᴏʀ: \`${targetNumber}\`\n` +
        `┃ 👑 sᴛᴀᴛᴜs: \`Owner\`\n` +
        `┃ 📊 ᴛᴏᴛᴀʟ: \`${config.owner.number.length}\` ᴏᴡɴᴇʀ\n` +
        `╰┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
