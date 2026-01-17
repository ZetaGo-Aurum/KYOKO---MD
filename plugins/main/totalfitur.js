const { getAllPlugins } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'totalfitur',
    alias: ['totalfeature', 'totalcmd', 'countplugin'],
    category: 'main',
    description: 'Lihat total fitur/command bot',
    usage: '.totalfitur',
    example: '.totalfitur',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const allPlugins = getAllPlugins()
        
        const categories = {}
        let totalCommands = 0
        let enabledCommands = 0
        let ownerCommands = 0
        let premiumCommands = 0
        let groupCommands = 0
        
        for (const plugin of allPlugins) {
            if (!plugin.config) continue
            
            const cat = plugin.config.category || 'other'
            if (!categories[cat]) {
                categories[cat] = { total: 0, enabled: 0 }
            }
            
            categories[cat].total++
            totalCommands++
            
            if (plugin.config.isEnabled !== false) {
                categories[cat].enabled++
                enabledCommands++
            }
            
            if (plugin.config.isOwner) ownerCommands++
            if (plugin.config.isPremium) premiumCommands++
            if (plugin.config.isGroup) groupCommands++
        }
        
        const sortedCats = Object.entries(categories)
            .sort((a, b) => b[1].total - a[1].total)
        
        let catList = ''
        for (const [cat, data] of sortedCats) {
            const emoji = getCategoryEmoji(cat)
            catList += `┃ ${emoji} ${cat}: \`${data.enabled}/${data.total}\`\n`
        }
        
        m.react('📊')
        return m.reply(
            `📊 *ᴛᴏᴛᴀʟ ꜰɪᴛᴜʀ*\n\n` +
            `╭┈┈⬡「 📈 *sᴛᴀᴛɪsᴛɪᴋ* 」\n` +
            `┃ 📦 ᴛᴏᴛᴀʟ: \`${totalCommands}\` fitur\n` +
            `┃ ✅ ᴀᴋᴛɪꜰ: \`${enabledCommands}\` fitur\n` +
            `┃ ❌ ɴᴏɴᴀᴋᴛɪꜰ: \`${totalCommands - enabledCommands}\` fitur\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🏷️ *ᴋᴀᴛᴇɢᴏʀɪ* 」\n` +
            catList +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🔐 *ᴀᴋsᴇs* 」\n` +
            `┃ 👑 ᴏᴡɴᴇʀ ᴏɴʟʏ: \`${ownerCommands}\`\n` +
            `┃ 💎 ᴘʀᴇᴍɪᴜᴍ: \`${premiumCommands}\`\n` +
            `┃ 👥 ɢʀᴏᴜᴘ ᴏɴʟʏ: \`${groupCommands}\`\n` +
            `╰┈┈⬡`
        )
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

function getCategoryEmoji(cat) {
    const emojis = {
        main: '🏠',
        owner: '👑',
        group: '👥',
        tools: '🔧',
        downloader: '⬇️',
        search: '🔍',
        fun: '🎮',
        game: '🎲',
        sticker: '🖼️',
        ai: '🤖',
        info: 'ℹ️',
        user: '👤',
        panel: '🖥️',
        jpm: '📢',
        pushkontak: '📞',
        religi: '🕌',
        other: '📁'
    }
    return emojis[cat.toLowerCase()] || '📁'
}

module.exports = {
    config: pluginConfig,
    handler
}
