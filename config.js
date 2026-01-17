/**
 * Untuk gambar/audio/video, ada di folder 'assets'
 * 
 * Credits & Thanks to
 * Developer = ZetaGo-Aurum
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEK
 */

const config = {

    owner: {
        name: 'ZetaGO-Aurum',                    // Nama owner
        number: ['6285702711107']         // Format: 628xxx (tanpa + atau 0)
    },

    session: {
        pairingNumber: '62*********',   // Nomor WA yang akan di-pair
        usePairingCode: true              // true = Pairing Code, false = QR Code
    },

    bot: {
        name: '𝗞𝗬𝗢𝗞𝗢 𝗠𝗗',                 // Nama bot
        version: '2.0.0',                 // Versi bot
        developer: 'ZetaGo-Aurum'         // Nama developer
    },

    mode: 'public',

    command: {
        prefix: '.'                       // Prefix utama (.menu, .help, dll)
    },

    limits: {
        default: 25,                      // User biasa
        premium: 100,                     // Premium user
        owner: -1                         // Owner (-1 = unlimited)
    },

    sticker: {
        packname: 'Kyoko-MD',             // Nama pack sticker
        author: 'KYOKO'                   // Author sticker
    },

    saluran: {
        id: '',                           // ID saluran (contoh: 120363xxx@newsletter)
        name: 'KYOKO MD Bot',              // Nama saluran
        link: ''                           // Link saluran
    },

    features: {
        antiSpam: true,
        antiSpamInterval: 3000,
        antiCall: true,
        autoTyping: true,
        autoRead: false,
        logMessage: true,
        dailyLimitReset: true,
        smartTriggers: false
    },

    welcome: { defaultEnabled: false },
    goodbye: { defaultEnabled: false },

    premiumUsers: [],
    bannedUsers: [],

    ui: {
        menuVariant: 2
    },

    messages: {
        wait: '⏳ Tunggu sebentar...',
        success: '✅ Berhasil!',
        error: '❌ Terjadi kesalahan!',
        ownerOnly: '🚫 Command ini khusus owner!',
        premiumOnly: '💎 Command ini khusus premium!',
        groupOnly: '👥 Command ini hanya untuk grup!',
        privateOnly: '📱 Command ini hanya untuk private chat!',
        cooldown: '⏱️ Tunggu %time% detik lagi!',
        limitExceeded: '📊 Limit harian kamu sudah habis!',
        banned: '🚫 Kamu dibanned dari bot ini!'
    },

    database: { path: './src/database' },
    backup: { enabled: false, intervalHours: 24, retainDays: 7 },
    scheduler: { resetHour: 0, resetMinute: 0 },

    // Dev mode settings (auto-enabled jika NODE_ENV=development)
    dev: {
        enabled: process.env.NODE_ENV === 'development',
        watchPlugins: true,    // Hot reload plugins (SAFE)
        watchSrc: false,       // DISABLED - src reload causes connection conflict 440
        debugLog: false        // Show stack traces
    },

    pterodactyl: {
        server1: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        // server2: {
        //     domain: '',
        //     apikey: '',
        //     capikey: '',
        //     egg: '15',
        //     nestid: '5',
        //     location: '1'
        // },
        // server3: {
        //     domain: '',
        //     apikey: '',
        //     capikey: '',
        //     egg: '15',
        //     nestid: '5',
        //     location: '1'
        // },
        sellers: [],
        ownerPanels: []
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - Jangan diubah tod, nanti elol!
// ═══════════════════════════════════════════════════════════════════════════

function isOwner(number) {
    if (!number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    
    if (config.bot.number) {
        const botClean = config.bot.number.replace(/[^0-9]/g, '')
        if (cleanNumber === botClean || cleanNumber.endsWith(botClean) || botClean.endsWith(cleanNumber)) return true
    }
    
    return config.owner.number.some(owner => {
        const cleanOwner = owner.replace(/[^0-9]/g, '')
        return cleanNumber === cleanOwner || cleanNumber.endsWith(cleanOwner) || cleanOwner.endsWith(cleanNumber)
    })
}

function isPremium(number) {
    if (!number) return false
    if (isOwner(number)) return true
    
    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.premiumUsers.some(premium => {
        const cleanPremium = premium.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
    })
}

function isBanned(number) {
    if (!number) return false
    if (isOwner(number)) return false
    
    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.bannedUsers.some(banned => {
        const cleanBanned = banned.replace(/[^0-9]/g, '')
        return cleanNumber === cleanBanned || cleanNumber.endsWith(cleanBanned) || cleanBanned.endsWith(cleanNumber)
    })
}

function setBotNumber(number) {
    if (number) config.bot.number = number.replace(/[^0-9]/g, '')
}

function isSelf(number) {
    if (!number || !config.bot.number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const botNumber = config.bot.number.replace(/[^0-9]/g, '')
    return cleanNumber.includes(botNumber) || botNumber.includes(cleanNumber)
}

function getConfig() { return config }

module.exports = {
    ...config,
    config,
    getConfig,
    isOwner,
    isPremium,
    isBanned,
    setBotNumber,
    isSelf
}
