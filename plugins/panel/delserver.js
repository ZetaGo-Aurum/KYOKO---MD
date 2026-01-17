const axios = require('axios')
const config = require('../../config')
const { isLid, lidToJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'delserver',
    alias: ['deleteserver', 'hapusserver'],
    category: 'panel',
    description: 'Hapus server dari panel',
    usage: '.delserver serverid',
    example: '.delserver 5',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
}

function cleanJid(jid) {
    if (!jid) return null
    if (isLid(jid)) jid = lidToJid(jid)
    return jid.includes('@') ? jid : jid + '@s.whatsapp.net'
}

function hasAccess(senderJid, isOwner, pteroConfig) {
    if (isOwner) return true
    const cleanSender = cleanJid(senderJid)?.split('@')[0]
    if (!cleanSender) return false
    const ownerPanels = pteroConfig?.ownerPanels || []
    return ownerPanels.includes(cleanSender)
}

function validateConfig(pteroConfig) {
    const missing = []
    if (!pteroConfig?.domain) missing.push('domain')
    if (!pteroConfig?.apikey) missing.push('apikey (PTLA)')
    return missing
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    
    if (!hasAccess(m.sender, m.isOwner, pteroConfig)) {
        return m.reply(`❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Fitur ini hanya untuk Owner atau Owner Panel.`)
    }
    
    const missingConfig = validateConfig(pteroConfig)
    if (missingConfig.length > 0) {
        let txt = `⚠️ *ᴋᴏɴꜰɪɢᴜʀᴀsɪ ʙᴇʟᴜᴍ ʟᴇɴɢᴋᴀᴘ*\n\n`
        txt += `> Isi di \`config.js\` bagian \`pterodactyl\`:\n`
        missingConfig.forEach(c => { txt += `> • ${c}\n` })
        return m.reply(txt)
    }
    
    const serverId = m.text?.trim()
    
    if (!serverId || isNaN(serverId)) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}delserver serverid\`\n\n` +
            `> Lihat server ID dengan \`${m.prefix}listserver\``
        )
    }
    
    try {
        const serverRes = await axios.get(`${pteroConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${pteroConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const server = serverRes.data.attributes
        
        await axios.delete(`${pteroConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${pteroConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        return m.reply(
            `✅ *sᴇʀᴠᴇʀ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Server ID: \`${serverId}\`\n` +
            `> Nama: \`${server.name}\``
        )
        
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢʜᴀᴘᴜs sᴇʀᴠᴇʀ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
