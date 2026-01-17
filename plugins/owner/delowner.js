const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'delowner',
    alias: ['removeowner', 'hapusowner'],
    category: 'owner',
    description: 'Menghapus owner dari bot',
    usage: '.delowner <nomor/@tag/reply>',
    example: '.delowner 6281234567890',
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
            `👑 *ᴅᴇʟ ᴏᴡɴᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ Reply pesan user\n` +
            `┃ ◦ Tag user @mention\n` +
            `┃ ◦ Ketik nomor langsung\n` +
            `╰┈┈⬡\n\n` +
            `\`Contoh: ${m.prefix}delowner 6281234567890\``
        )
    }
    
    const ownerList = config.owner?.number || []
    
    if (ownerList.length <= 1) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa menghapus owner terakhir`)
    }
    
    const index = ownerList.findIndex(num => {
        const cleanNum = num.replace(/[^0-9]/g, '')
        return cleanNum.includes(targetNumber) || targetNumber.includes(cleanNum)
    })
    
    if (index === -1) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nomor \`${targetNumber}\` bukan owner`)
    }
    
    const removedNumber = config.owner.number.splice(index, 1)[0]
    
    const db = getDatabase()
    db.setting('ownerNumbers', config.owner.number)
    
    m.react('✅')
    
    await m.reply(
        `✅ *ᴏᴡɴᴇʀ ᴅɪʜᴀᴘᴜs*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📱 ɴᴏᴍᴏʀ: \`${removedNumber}\`\n` +
        `┃ ❌ sᴛᴀᴛᴜs: \`Removed\`\n` +
        `┃ 📊 sɪsᴀ: \`${config.owner.number.length}\` ᴏᴡɴᴇʀ\n` +
        `╰┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
