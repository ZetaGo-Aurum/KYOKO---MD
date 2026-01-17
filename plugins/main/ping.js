/**
 * @file plugins/main/ping.js
 * @description Ping command - simpel dan human-like
 */

const os = require('os')

const pluginConfig = {
    name: 'ping',
    alias: ['p', 'speed'],
    category: 'main',
    description: 'Cek apakah bot online',
    usage: '.ping',
    example: '.ping',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
}

// Variasi respons biar ga terasa AI
const responses = [
    'yoo! 🏓',
    'hadir bos~ 🙌',
    'online woi 🔥',
    'siap laksanakan! 💪',
    'apa kabar? 😎',
    'masih idup kok 😅',
    'pong! 🏓',
    'halo halo~ 👋',
    'siapp! ⚡',
    'ready as always 🚀'
]

function formatUptime(ms) {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    
    if (d > 0) return `${d} hari ${h % 24} jam`
    if (h > 0) return `${h} jam ${m % 60} menit`
    if (m > 0) return `${m} menit ${s % 60} detik`
    return `${s} detik`
}

async function handler(m, { sock, uptime }) {
    const start = Date.now()
    
    // Kirim pong dulu
    await m.react('🏓')
    
    const ping = Date.now() - start
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    // Simple response
    let txt = `${randomResponse}\n\n`
    txt += `⚡ *${ping}ms*\n`
    txt += `⏱️ Uptime: *${formatUptime(uptime)}*`
    
    // Kadang tambahin info extra
    if (Math.random() > 0.7) {
        const mem = process.memoryUsage()
        const usedMB = Math.round(mem.heapUsed / 1024 / 1024)
        txt += `\n💾 RAM: *${usedMB}MB*`
    }
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
