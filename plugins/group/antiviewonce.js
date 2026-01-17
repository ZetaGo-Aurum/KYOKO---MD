const pluginConfig = {
    name: 'antiviewonce',
    alias: ['antivo', 'anti1xlihat'],
    category: 'group',
    description: 'Mengaktifkan/menonaktifkan anti view once di grup',
    usage: '.antiviewonce <on/off>',
    example: '.antiviewonce on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const groupId = m.chat
    const group = db.getGroup(groupId) || {}

    if (!action) {
        const status = group.antiviewonce || 'off'

        await m.reply(
            `👁️ *ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ sᴇᴛᴛɪɴɢs*\n\n` +
            `> Status: *${status === 'on' ? '✅ Aktif' : '❌ Nonaktif'}*\n\n` +
            `> Fitur ini mengubah pesan 1x lihat\n` +
            `> menjadi gambar/video biasa.\n\n` +
            `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n` +
            `> \`${m.prefix}antiviewonce on\` → Aktifkan\n` +
            `> \`${m.prefix}antiviewonce off\` → Nonaktifkan`
        )
        return
    }

    if (action === 'on') {
        db.setGroup(groupId, { ...group, antiviewonce: 'on' })
        await m.reply(
            `✅ *ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ ᴀᴋᴛɪꜰ*\n\n` +
            `> Anti view once berhasil diaktifkan!\n` +
            `> Pesan 1x lihat akan diubah jadi biasa.`
        )
        return
    }

    if (action === 'off') {
        db.setGroup(groupId, { ...group, antiviewonce: 'off' })
        await m.reply(
            `❌ *ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Anti view once berhasil dinonaktifkan.`
        )
        return
    }

    await m.reply(
        `❌ *ᴘɪʟɪʜᴀɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n` +
        `> Gunakan: on atau off`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
