const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'deladmin',
    alias: ['deleteadmin', 'hapusadmin'],
    category: 'panel',
    description: 'Hapus admin panel',
    usage: '.deladmin userid',
    example: '.deladmin 5',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
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
    
    const userId = m.text?.trim()
    
    if (!userId || isNaN(userId)) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}deladmin userid\`\n\n` +
            `> Lihat user ID dengan \`${m.prefix}listadmin\``
        )
    }
    
    try {
        const userRes = await axios.get(`${pteroConfig.domain}/api/application/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${pteroConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const user = userRes.data.attributes
        
        await axios.delete(`${pteroConfig.domain}/api/application/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${pteroConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        return m.reply(
            `✅ *ᴀᴅᴍɪɴ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> User ID: \`${userId}\`\n` +
            `> Username: \`${user.username}\`\n` +
            `> Email: \`${user.email}\``
        )
        
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢʜᴀᴘᴜs ᴀᴅᴍɪɴ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
