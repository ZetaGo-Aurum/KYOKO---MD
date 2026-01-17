const fileType = require('file-type')
const fs = require('fs')
const path = require('path')
const { config } = require('../../config')
const botConfig = config

const pluginConfig = {
    name: 'swgc',
    alias: ['statusgrup', 'swgroup', 'groupstory'],
    category: 'owner',
    description: 'Post Group Status/Story ke grup pilihan (border hijau)',
    usage: '.swgc <teks> atau reply media',
    example: '.swgc Halo semua!',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
}

const pendingSwgc = new Map()

async function handler(m, { sock, db }) {
    const args = m.args || []
    const text = m.text || ''
    if (args[0] === '--confirm' && args[1]) {
        const targetGroupId = args[1]
        const pendingData = pendingSwgc.get(m.sender)
        
        if (!pendingData) {
            await m.reply(`⚠️ *Tidak ada data pending. Silakan kirim ulang media + .swgc*`)
            return
        }
        
        try {
            let groupName = 'Grup'
            try {
                const meta = await sock.groupMetadata(targetGroupId)
                groupName = meta.subject
            } catch (e) {}
            
            await m.reply(`⏳ *Posting group story ke ${groupName}...*`)
            
            // Send Group Story
            await sock.sendMessage(targetGroupId, {
                groupStatusMessage: pendingData.content
            })
            
            const successMsg = `✅ *ɢʀᴏᴜᴘ sᴛᴏʀʏ ᴅɪᴘᴏsᴛ*

╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」
┃ ㊗ 📡 sᴛᴀᴛᴜs: *🟢 Berhasil*
┃ ㊗ 🏠 ɢʀᴜᴘ: *${groupName}*
┃ ㊗ 📝 ᴛɪᴘᴇ: *${pendingData.content.text ? 'Teks' : pendingData.content.image ? 'Gambar' : 'Video'}*
╰┈┈⬡

> _Icon grup sekarang punya border hijau!_
> _Member bisa lihat story grup._`
            
            await m.reply(successMsg)
            pendingSwgc.delete(m.sender)
            if (pendingData.tempFile && fs.existsSync(pendingData.tempFile)) {
                setTimeout(() => {
                    try { fs.unlinkSync(pendingData.tempFile) } catch (e) {}
                }, 5000)
            }
            
        } catch (error) {
            await m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Gagal posting story.\n` +
                `> _${error.message}_`
            )
        }
        return
    }
    let storyContent = {}
    let buffer, ext, tempFile
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
    if (m.quoted && (m.quoted.isImage || m.quoted.isVideo)) {
        try {
            buffer = await m.quoted.download()
            if (!buffer) {
                await m.reply(`❌ Gagal mengambil media.`)
                return
            }
            ext = (await fileType.fromBuffer(buffer))?.ext || 'bin'
            tempFile = path.join(tempDir, `swgc_${Date.now()}.${ext}`)
            fs.writeFileSync(tempFile, buffer)
            
            if (m.quoted.isImage) {
                storyContent.image = { url: tempFile }
                if (text) storyContent.caption = text
            } else if (m.quoted.isVideo) {
                storyContent.video = { url: tempFile }
                if (text) storyContent.caption = text
            }
        } catch (e) {
            await m.reply(`❌ Media gagal diproses.`)
            return
        }
    } else if (m.isImage || m.isVideo) {
        try {
            buffer = await m.download()
            if (!buffer) {
                await m.reply(`❌ Gagal mengambil media.`)
                return
            }
            ext = (await fileType.fromBuffer(buffer))?.ext || 'bin'
            tempFile = path.join(tempDir, `swgc_${Date.now()}.${ext}`)
            fs.writeFileSync(tempFile, buffer)
            if (m.isImage) {
                storyContent.image = { url: tempFile }
                if (text) storyContent.caption = text
            } else if (m.isVideo) {
                storyContent.video = { url: tempFile }
                if (text) storyContent.caption = text
            }
        } catch (e) {
            await m.reply(`❌ Media gagal diproses.`)
            return
        }
    } else if (text && text.trim()) {
        // Text-only story
        storyContent.text = text
    } else {
        await m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}swgc teks\` - Story teks\n` +
            `> Reply gambar/video + \`${m.prefix}swgc\`\n` +
            `> Kirim gambar/video + caption \`${m.prefix}swgc\``
        )
        return
    }
    pendingSwgc.set(m.sender, {
        content: storyContent,
        tempFile: tempFile,
        timestamp: Date.now()
    })
    try {
        global.isFetchingGroups = true
        const groups = await sock.groupFetchAllParticipating()
        global.isFetchingGroups = false
        const groupList = Object.entries(groups)
        
        if (groupList.length === 0) {
            await m.reply(`⚠️ *Bot tidak berada di grup manapun.*`)
            return
        }
        const groupRows = groupList.map(([id, meta]) => ({
            title: meta.subject || 'Unknown Group',
            description: id,
            id: `${m.prefix}swgc --confirm ${id}`
        }))
        const prefix = m.prefix || '.'
        await sock.sendMessage(m.chat, {
            text: `📋 *ᴘɪʟɪʜ ɢʀᴜᴘ ᴜɴᴛᴜᴋ ᴘᴏsᴛ sᴛᴏʀʏ*\n\n` +
                  `> Media: *${storyContent.text ? 'Teks' : storyContent.image ? 'Gambar' : 'Video'}*\n` +
                  `> Total Grup: *${groupList.length}*\n\n` +
                  `_Pilih grup dari daftar di bawah:_`,
            contextinfo: {
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: botConfig?.saluran?.id,
                    newsletterName: botConfig?.saluran?.name,
                },
                externalAdReply: {
                    title: botConfig.bot.name,
                    body: "SW GRUP",
                    thumbnail: fs.readFileSync('./assets/images/ourin2.jpg'),
                    sourceUrl: botConfig.saluran.link,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            },
            footer: 'OURIN MD',
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '🏠 Pilih Grup',
                        sections: [{
                            title: 'Daftar Grup',
                            rows: groupRows
                        }]
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '❌ Batal',
                        id: `${prefix}cancelswgc`
                    })
                }
            ]
        })
    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Gagal mengambil daftar grup.\n` +
            `> _${error.message}_`
        )
        if (tempFile && fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile) } catch (e) {}
        }
        pendingSwgc.delete(m.sender)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
