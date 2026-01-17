const pluginConfig = {
    name: 'delete',
    alias: ['del', 'hapus', 'd'],
    category: 'group',
    description: 'Hapus pesan dengan reply',
    usage: '.delete (reply pesan)',
    example: '.delete',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 3,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    // Validasi: harus reply pesan
    if (!m.quoted) {
        return m.reply('⚠️ *Reply pesan yang ingin dihapus!*')
    }
    
    try {
        // Delete the quoted message
        await sock.sendMessage(m.chat, { 
            delete: m.quoted.key 
        })
        
        // React dengan checkmark (tanpa reply text)
        await m.react('✅')
        
    } catch (err) {
        // Hanya reply jika error
        if (err.message?.includes('not found') || err.message?.includes('forbidden')) {
            await m.reply('❌ *Gagal menghapus!*\n> Pesan mungkin sudah dihapus atau terlalu lama.')
        } else {
            await m.react('❌')
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
