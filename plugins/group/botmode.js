const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'botmode',
    alias: ['setmode', 'mode'],
    category: 'group',
    description: 'Atur mode bot untuk grup ini (md/cpanel/pushkontak)',
    usage: '.botmode <md/cpanel/pushkontak>',
    example: '.botmode cpanel',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

const MODES = {
    md: {
        name: 'Multi-Device',
        desc: 'Mode default dengan semua fitur standar + JPM'
    },
    cpanel: {
        name: 'CPanel Pterodactyl',
        desc: 'Mode khusus untuk panel server'
    },
    pushkontak: {
        name: 'Push Kontak',
        desc: 'Mode khusus untuk push kontak ke member'
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.text?.trim().toLowerCase()
    
    const groupData = db.getGroup(m.chat) || {}
    const currentMode = groupData.botMode || 'md'
    
    if (!args) {
        let modeList = ''
        for (const [key, val] of Object.entries(MODES)) {
            const isCurrent = key === currentMode ? ' ⬅️' : ''
            modeList += `┃ \`${m.prefix}botmode ${key}\`${isCurrent}\n`
            modeList += `┃ └ ${val.desc}\n`
        }
        
        return m.reply(
            `🔧 *ʙᴏᴛ ᴍᴏᴅᴇ*\n\n` +
            `> Mode saat ini: *${currentMode.toUpperCase()}* (${MODES[currentMode]?.name || 'Unknown'})\n\n` +
            `╭─「 📋 *ᴘɪʟɪʜᴀɴ* 」\n` +
            `${modeList}` +
            `╰───────────────\n\n` +
            `> _Pengaturan per-grup_`
        )
    }
    
    if (!Object.keys(MODES).includes(args)) {
        return m.reply(`❌ Mode tidak valid. Pilihan: \`md\`, \`cpanel\`, \`pushkontak\``)
    }
    
    db.setGroup(m.chat, { ...groupData, botMode: args })
    
    m.react('✅')
    
    return m.reply(
        `✅ *ᴍᴏᴅᴇ ᴅɪᴜʙᴀʜ*\n\n` +
        `> Mode: *${args.toUpperCase()}* (${MODES[args].name})\n` +
        `> Grup: *${m.chat.split('@')[0]}*\n\n` +
        `> Ketik \`${m.prefix}menu\` untuk melihat menu.`
    )
}

function getGroupMode(chatJid, db) {
    if (!chatJid?.endsWith('@g.us')) return 'md'
    const groupData = db.getGroup(chatJid) || {}
    return groupData.botMode || 'md'
}

module.exports = {
    config: pluginConfig,
    handler,
    getGroupMode,
    MODES
}
