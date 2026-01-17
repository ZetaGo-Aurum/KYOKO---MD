const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addlist',
    alias: ['tambahlist', 'buatlist', 'createlist'],
    category: 'utility',
    description: 'Membuat list baru',
    usage: '.addlist <nama>|<isi>',
    example: '.addlist resep|Nasi Goreng: Bahan...',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const input = m.args.join(' ')
    
    if (!input || !input.includes('|')) {
        return m.reply(
            `📝 *ᴀᴅᴅ ʟɪsᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ꜰᴏʀᴍᴀᴛ* 」\n` +
            `┃ \`.addlist nama|isi\`\n` +
            `╰┈┈⬡\n\n` +
            `\`Contoh:\`\n` +
            `\`${m.prefix}addlist resep|Nasi Goreng:\`\n` +
            `\`- 2 piring nasi\`\n` +
            `\`- 2 butir telur\``
        )
    }
    
    const [name, ...contentParts] = input.split('|')
    const listName = name.trim().toLowerCase()
    const content = contentParts.join('|').trim()
    
    if (!listName) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nama list tidak boleh kosong`)
    }
    
    if (!content) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Isi list tidak boleh kosong`)
    }
    
    if (listName.length > 50) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nama list maksimal 50 karakter`)
    }
    
    const chatId = m.isGroup ? m.chat : m.sender
    let userData = m.isGroup ? db.getGroup(chatId) : db.getUser(m.sender)
    
    if (!userData) {
        if (m.isGroup) {
            db.setGroup(chatId, { lists: {} })
            userData = db.getGroup(chatId)
        } else {
            db.setUser(m.sender, { lists: {} })
            userData = db.getUser(m.sender)
        }
    }
    
    const lists = userData?.lists || {}
    
    if (lists[listName]) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> List \`${listName}\` sudah ada\n> Gunakan \`.dellist ${listName}\` untuk menghapus`)
    }
    
    lists[listName] = {
        content: content,
        creator: m.sender,
        createdAt: Date.now()
    }
    
    if (m.isGroup) {
        db.setGroup(chatId, { lists })
    } else {
        db.setUser(m.sender, { lists })
    }
    
    m.react('✅')
    
    await m.reply(
        `✅ *ʟɪsᴛ ᴅɪʙᴜᴀᴛ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📝 ɴᴀᴍᴀ: \`${listName}\`\n` +
        `┃ 📊 ᴘᴀɴᴊᴀɴɢ: \`${content.length} char\`\n` +
        `┃ 🔗 sᴄᴏᴘᴇ: \`${m.isGroup ? 'Grup' : 'Private'}\`\n` +
        `╰┈┈⬡\n\n` +
        `> Gunakan \`.list ${listName}\` untuk melihat`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
