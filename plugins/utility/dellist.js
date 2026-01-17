const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'dellist',
    alias: ['hapuslist', 'removelist', 'deletelist'],
    category: 'utility',
    description: 'Menghapus list',
    usage: '.dellist <nama>',
    example: '.dellist resep',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const listName = m.args.join(' ').trim().toLowerCase()
    
    if (!listName) {
        return m.reply(
            `🗑️ *ᴅᴇʟ ʟɪsᴛ*\n\n` +
            `> Gunakan: \`.dellist <nama>\`\n\n` +
            `\`Contoh: ${m.prefix}dellist resep\``
        )
    }
    
    const chatId = m.isGroup ? m.chat : m.sender
    const userData = m.isGroup ? db.getGroup(chatId) : db.getUser(m.sender)
    const lists = userData?.lists || {}
    
    if (!lists[listName]) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> List \`${listName}\` tidak ditemukan`)
    }
    
    const isCreator = lists[listName].creator === m.sender
    const isOwner = require('../../config').isOwner(m.sender)
    const isAdmin = m.isAdmin
    
    if (!isCreator && !isOwner && !isAdmin) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Hanya pembuat list atau admin yang bisa menghapus`)
    }
    
    delete lists[listName]
    
    if (m.isGroup) {
        db.setGroup(chatId, { lists })
    } else {
        db.setUser(m.sender, { lists })
    }
    
    m.react('✅')
    
    await m.reply(`✅ *ʟɪsᴛ ᴅɪʜᴀᴘᴜs*\n\n> List \`${listName}\` berhasil dihapus`)
}

module.exports = {
    config: pluginConfig,
    handler
}
