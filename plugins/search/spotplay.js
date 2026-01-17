const axios = require('axios')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'spotplay',
    alias: ['splay', 'sp'],
    category: 'search',
    description: 'Putar musik dari Spotify',
    usage: '.spotplay <query>',
    example: '.spotplay neffex grateful',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}spotplay <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}spotplay neffex grateful\``
        )
    }
    
    try {
        const searchRes = await axios.get(`https://api.nekolabs.web.id/dsc/spotify/search?q=${encodeURIComponent(query)}`)
        
        if (!searchRes.data?.success || !searchRes.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const track = searchRes.data.result[0]
        
        const dlRes = await axios.get(`https://api.nekolabs.web.id/dwn/spotify/v1?url=${encodeURIComponent(track.url)}`)
        
        if (!dlRes.data?.success || !dlRes.data?.result?.downloadUrl) {
            return m.reply(`❌ Gagal mendapatkan link download.`)
        }

        const downloadUrl = dlRes.data.result.downloadUrl
        
        if (downloadUrl.includes('undefined')) {
            return m.reply(`❌ Link download tidak tersedia untuk lagu ini.`)
        }
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const tempMp3 = path.join(tempDir, `spotplay_${Date.now()}.mp3`)
 
        const mp3Res = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
        fs.writeFileSync(tempMp3, Buffer.from(mp3Res.data))
  
        const audioBuffer = fs.readFileSync(tempMp3)
        
        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            contextInfo: {
                externalAdReply: {
                    title: dlRes.data.result.title,
                    body: dlRes.data.result.artist,
                    thumbnailUrl: dlRes.data.result.cover,
                    mediaType: 2,
                    mediaUrl: dlRes.data.result.url,
                    sourceUrl: dlRes.data.result.url,
                },
                isForwarded: true,
                forwardingScore: 999,
            }
        }, { quoted: m })
        
        fs.unlinkSync(tempMp3)
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
