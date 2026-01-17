const axios = require('axios')

const pluginConfig = {
    name: 'fakestory',
    alias: ['fstory', 'fakeinsta'],
    category: 'canvas',
    description: 'Membuat fake Instagram story',
    usage: '.fakestory <nama>|<text>',
    example: '.fakestory Misaki|Hai semua',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

const DEFAULT_PP = 'https://i.ibb.co/6bWvFpg/avatar.jpg'

async function getProfilePicture(sock, jid) {
    try {
        const pp = await sock.profilePictureUrl(jid, 'image')
        return pp || DEFAULT_PP
    } catch {
        return DEFAULT_PP
    }
}

async function handler(m, { sock }) {
    const input = m.args.join(' ')
    if (!input || !input.includes('|')) {
        return m.reply(`📷 *ꜰᴀᴋᴇ sᴛᴏʀʏ*\n\n> Format: nama|text\n\n\`Contoh: ${m.prefix}fakestory Misaki|Hai semua\`\n\n> Reply gambar atau otomatis pakai PP sender`)
    }
    
    const [name, text] = input.split('|').map(s => s.trim())
    if (!name || !text) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Format salah. Gunakan: nama|text`)
    }
    
    m.react('📷')
    
    try {
        let profileUrl = DEFAULT_PP
        
        const isImage = m.isImage || (m.quoted && m.quoted.isImage)
        
        if (isImage) {
            let mediaBuffer
            if (m.isImage && m.download) {
                mediaBuffer = await m.download()
            } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
                mediaBuffer = await m.quoted.download()
            }
            
            if (mediaBuffer) {
                const FormData = require('form-data')
                const form = new FormData()
                form.append('file', mediaBuffer, { filename: 'image.jpg' })
                
                const uploadRes = await axios.post('https://uguu.se/upload', form, {
                    headers: form.getHeaders(),
                    timeout: 30000
                })
                
                if (uploadRes.data?.files?.[0]?.url) {
                    profileUrl = uploadRes.data.files[0].url
                }
            }
        } else {
            profileUrl = await getProfilePicture(sock, m.sender)
        }
        
        const url = `https://zelapioffciall.koyeb.app/canvas/fakestory?name=${encodeURIComponent(name)}&text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`
        
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 30000
        })
        
        if (!response.data || response.data.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `📷 *ꜰᴀᴋᴇ sᴛᴏʀʏ*\n\n> ɴᴀᴍᴇ: \`${name}\`\n> ᴛᴇxᴛ: \`${text}\``
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
