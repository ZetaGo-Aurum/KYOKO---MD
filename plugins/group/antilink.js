const pluginConfig = {
    name: 'antilink',
    alias: ['al'],
    category: 'group',
    description: 'Mengaktifkan/menonaktifkan anti link di grup',
    usage: '.antilink <on/off/kick/remove>',
    example: '.antilink on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const groupId = m.chat
    const group = db.getGroup(groupId) || {}

    if (!action) {
        const status = group.antilink || 'off'
        const mode = group.antilinkMode || 'remove'
        const modeText = mode === 'kick' ? 'Kick User' : 'Hapus Pesan'

        await m.reply(
            `🔗 *ᴀɴᴛɪʟɪɴᴋ sᴇᴛᴛɪɴɢs*\n\n` +
            `> Status: *${status === 'on' ? '✅ Aktif' : '❌ Nonaktif'}*\n` +
            `> Mode: *${modeText}*\n\n` +
            `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n` +
            `> \`${m.prefix}antilink on\` → Aktifkan\n` +
            `> \`${m.prefix}antilink off\` → Nonaktifkan\n` +
            `> \`${m.prefix}antilink kick\` → Mode kick user\n` +
            `> \`${m.prefix}antilink remove\` → Mode hapus pesan`
        )
        return
    }

    if (action === 'on') {
        db.setGroup(groupId, { ...group, antilink: 'on' })
        await m.reply(
            `✅ *ᴀɴᴛɪʟɪɴᴋ ᴀᴋᴛɪꜰ*\n\n` +
            `> Antilink berhasil diaktifkan!\n` +
            `> Semua link akan ditindak sesuai mode.`
        )
        return
    }

    if (action === 'off') {
        db.setGroup(groupId, { ...group, antilink: 'off' })
        await m.reply(
            `❌ *ᴀɴᴛɪʟɪɴᴋ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Antilink berhasil dinonaktifkan.`
        )
        return
    }

    if (action === 'kick') {
        db.setGroup(groupId, { ...group, antilink: 'on', antilinkMode: 'kick' })
        await m.reply(
            `⚠️ *ᴍᴏᴅᴇ ᴋɪᴄᴋ*\n\n` +
            `> Antilink dengan mode KICK aktif!\n` +
            `> User yang mengirim link akan dikeluarkan.`
        )
        return
    }

    if (action === 'remove') {
        db.setGroup(groupId, { ...group, antilink: 'on', antilinkMode: 'remove' })
        await m.reply(
            `🗑️ *ᴍᴏᴅᴇ ʀᴇᴍᴏᴠᴇ*\n\n` +
            `> Antilink dengan mode REMOVE aktif!\n` +
            `> Pesan link akan dihapus tanpa kick.`
        )
        return
    }

    await m.reply(
        `❌ *ᴘɪʟɪʜᴀɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n` +
        `> Gunakan: on, off, kick, atau remove`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
