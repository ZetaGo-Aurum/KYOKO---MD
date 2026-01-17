const { getParticipantJids } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'kick',
    alias: ['remove', 'tendang'],
    category: 'group',
    description: 'Kick member dari grup',
    usage: '.kick @user',
    example: '.kick @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    let target = null

    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0]
    }

    if (!target) {
        await m.reply(
            `❌ *ᴛᴀʀɢᴇᴛ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Reply pesan user atau mention!\n` +
            `> Contoh: \`${m.prefix}kick @user\``
        )
        return
    }

    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'

    if (target === botNumber) {
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa kick bot sendiri!`)
        return
    }

    if (target === m.sender) {
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa kick diri sendiri!`)
        return
    }

    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        const adminParticipants = groupMeta.participants.filter(p => p.admin)
        const admins = getParticipantJids(adminParticipants)

        if (admins.includes(target)) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa kick admin grup!`)
            return
        }

        await sock.groupParticipantsUpdate(m.chat, [target], 'remove')

        await m.reply(
            `✅ *ʙᴇʀʜᴀsɪʟ*\n\n` +
            `> @${target.split('@')[0]} telah dikeluarkan dari grup.`,
            { mentions: [target] }
        )

    } catch (error) {
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
