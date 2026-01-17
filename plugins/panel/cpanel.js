const config = require('../../config')

const pluginConfig = {
    name: 'cpanel',
    alias: ['panelmenu', 'menupanel'],
    category: 'panel',
    description: 'Menu panel pterodactyl',
    usage: '.cpanel',
    example: '.cpanel',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    const prefix = m.prefix || '.'
    
    const hasConfig = pteroConfig?.domain && pteroConfig?.apikey
    const configStatus = hasConfig ? '✅ Configured' : '❌ Not configured'
    const sellerCount = pteroConfig?.sellers?.length || 0
    const ownerPanelCount = pteroConfig?.ownerPanels?.length || 0
    
    let txt = `🖥️ *ᴄᴘᴀɴᴇʟ ᴍᴇɴᴜ*\n\n`
    txt += `> Panel: *${configStatus}*\n`
    txt += `> Sellers: *${sellerCount}*\n`
    txt += `> Owner Panel: *${ownerPanelCount}*\n\n`
    
    txt += `╭─「 📦 *ᴄʀᴇᴀᴛᴇ sᴇʀᴠᴇʀ* 」\n`
    txt += `┃ \`${prefix}1gb\` - \`${prefix}10gb\`\n`
    txt += `┃ \`${prefix}unli\` (unlimited)\n`
    txt += `┃ Format: username atau username,nomor\n`
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 👥 *sᴇʟʟᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ* 」\n`
    txt += `┃ \`${prefix}addseller\` - Tambah seller\n`
    txt += `┃ \`${prefix}delseller\` - Hapus seller\n`
    txt += `┃ \`${prefix}listseller\` - List seller\n`
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 👑 *ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ* 」\n`
    txt += `┃ \`${prefix}addownpanel\` - Tambah owner panel\n`
    txt += `┃ \`${prefix}delownpanel\` - Hapus owner panel\n`
    txt += `┃ \`${prefix}listownpanel\` - List owner panel\n`
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 🔐 *ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ* 」\n`
    txt += `┃ \`${prefix}cadmin\` - Create admin\n`
    txt += `┃ \`${prefix}deladmin\` - Hapus admin\n`
    txt += `┃ \`${prefix}listadmin\` - List admin\n`
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 🖥️ *sᴇʀᴠᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ* 」\n`
    txt += `┃ \`${prefix}listserver\` - List semua server\n`
    txt += `┃ \`${prefix}delserver\` - Hapus server\n`
    txt += `┃ \`${prefix}serverinfo\` - Info detail server\n`
    txt += `╰───────────────\n\n`
    
    txt += `> _Powered by Pterodactyl Panel API_`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
