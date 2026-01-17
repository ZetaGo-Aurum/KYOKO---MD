const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'list',
    alias: ['getlist', 'showlist', 'lihatlist'],
    category: 'utility',
    description: 'Melihat list',
    usage: '.list [nama]',
    example: '.list resep',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const listName = m.args.join(' ').trim().toLowerCase()
    
    const chatId = m.isGroup ? m.chat : m.sender
    const userData = m.isGroup ? db.getGroup(chatId) : db.getUser(m.sender)
    const lists = userData?.lists || {}
    
    const listKeys = Object.keys(lists)
    
    if (listKeys.length === 0) {
        return m.reply(
            `📋 *ʟɪsᴛ ᴋᴏsᴏɴɢ*\n\n` +
            `> Belum ada list yang dibuat\n\n` +
            `> Gunakan \`.addlist nama|isi\` untuk membuat`
        )
    }
    
    if (!listName) {
        let text = `╭━━━━━━━━━━━━━━━━━╮\n`
        text += `┃  📋 *ᴅᴀꜰᴛᴀʀ ʟɪsᴛ*\n`
        text += `╰━━━━━━━━━━━━━━━━━╯\n\n`
        
        text += `╭┈┈⬡「 📝 *${listKeys.length} ʟɪsᴛ* 」\n`
        
        for (let i = 0; i < listKeys.length; i++) {
            const key = listKeys[i]
            const preview = lists[key].content.substring(0, 30)
            text += `┃ ${i + 1}. *${key}*\n`
            text += `┃    _${preview}${lists[key].content.length > 30 ? '...' : ''}_\n`
        }
        
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        text += `> Gunakan \`.list <nama>\` untuk melihat isi`
        
        await m.reply(text)
        return
    }
    
    if (!lists[listName]) {
        const suggestions = listKeys.filter(k => k.includes(listName) || listName.includes(k))
        let text = `❌ *ɢᴀɢᴀʟ*\n\n> List \`${listName}\` tidak ditemukan`
        
        if (suggestions.length > 0) {
            text += `\n\n> Mungkin maksud kamu:\n`
            suggestions.forEach(s => {
                text += `> - \`${s}\`\n`
            })
        }
        
        return m.reply(text)
    }
    
    const list = lists[listName]
    const creator = list.creator?.split('@')[0] || 'Unknown'
    const date = new Date(list.createdAt).toLocaleDateString('id-ID')
    
    let text = `╭━━━━━━━━━━━━━━━━━╮\n`
    text += `┃  📋 *${listName.toUpperCase()}*\n`
    text += `╰━━━━━━━━━━━━━━━━━╯\n\n`
    text += `${list.content}\n\n`
    text += `> 👤 Pembuat: ${creator}\n`
    text += `> 📅 Tanggal: ${date}`
    
    await m.reply(text)
}

module.exports = {
    config: pluginConfig,
    handler
}
