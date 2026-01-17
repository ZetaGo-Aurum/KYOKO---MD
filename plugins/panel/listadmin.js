const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'listadmin',
    alias: ['adminlist', 'admins'],
    category: 'panel',
    description: 'List semua admin panel',
    usage: '.listadmin',
    example: '.listadmin',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

function validateConfig(pteroConfig) {
    const missing = []
    if (!pteroConfig?.domain) missing.push('domain')
    if (!pteroConfig?.apikey) missing.push('apikey (PTLA)')
    return missing
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    
    const missingConfig = validateConfig(pteroConfig)
    if (missingConfig.length > 0) {
        let txt = `⚠️ *ᴋᴏɴꜰɪɢᴜʀᴀsɪ ʙᴇʟᴜᴍ ʟᴇɴɢᴋᴀᴘ*\n\n`
        txt += `> Isi di \`config.js\` bagian \`pterodactyl\`:\n`
        missingConfig.forEach(c => { txt += `> • ${c}\n` })
        return m.reply(txt)
    }
    
    try {
        const res = await axios.get(`${pteroConfig.domain}/api/application/users`, {
            headers: {
                'Authorization': `Bearer ${pteroConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const users = res.data.data || []
        const admins = users.filter(u => u.attributes.root_admin)
        
        if (admins.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ*\n\n> Tidak ada admin terdaftar.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ*\n\n`
        txt += `> Total: *${admins.length}* admin\n\n`
        
        admins.forEach((u, i) => {
            const attr = u.attributes
            txt += `${i + 1}. *${attr.username}*\n`
            txt += `   └ ID: \`${attr.id}\` | Email: \`${attr.email}\`\n`
        })
        
        return m.reply(txt)
        
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀᴛᴀ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
