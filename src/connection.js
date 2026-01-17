/**
 * Credits & Thanks to
 * Developer = Lucky Archz ( Zann )
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEK
 * 
 * Saluran Resmi Ourin:
 * https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t 
 * 
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require('ourin');

const path = require('path');
const fs = require('fs');
const pino = require('pino');
const config = require('../config');
const { logger, c, logConnection, createBanner } = require('./lib/colors');
const { extendSocket } = require('./lib/sockHelper');

// Session path
const SESSION_PATH = path.join(process.cwd(), 'storage', 'session');

// Start time untuk uptime
let startTime = Date.now();

/**
 * Get bot uptime in milliseconds
 * @returns {number} Uptime in ms
 */
function getUptime() {
    return Date.now() - startTime;
}

/**
 * Format phone number untuk pairing
 * @param {string} number - Nomor telepon
 * @returns {string} Formatted number
 */
function formatPhoneNumber(number) {
    if (!number) return '';
    return number.replace(/[^0-9]/g, '');
}

/**
 * Display pairing code dengan box hijau
 * @param {string} code - Pairing code
 */
function displayPairingCode(code) {
    const BOX = { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' };
    const width = 45;
    
    console.log('');
    console.log(`${c.green(BOX.tl)}${c.green(BOX.h.repeat(width))}${c.green(BOX.tr)}`);
    console.log(`${c.green(BOX.v)}${' '.repeat(width)}${c.green(BOX.v)}`);
    console.log(`${c.green(BOX.v)}${c.whiteBold('                PAIRING CODE                ')}${c.green(BOX.v)}`);
    console.log(`${c.green(BOX.v)}${' '.repeat(width)}${c.green(BOX.v)}`);
    console.log(`${c.green(BOX.v)}       ${c.greenBold(code)}       ${' '.repeat(16)}${c.green(BOX.v)}`);
    console.log(`${c.green(BOX.v)}${' '.repeat(width)}${c.green(BOX.v)}`);
    console.log(`${c.green(BOX.v)}  ${c.gray('Masukkan kode ini di WhatsApp')}${' '.repeat(13)}${c.green(BOX.v)}`);
    console.log(`${c.green(BOX.v)}  ${c.gray('Settings > Linked Devices > Link a Device')} ${c.green(BOX.v)}`);
    console.log(`${c.green(BOX.v)}${' '.repeat(width)}${c.green(BOX.v)}`);
    console.log(`${c.green(BOX.bl)}${c.green(BOX.h.repeat(width))}${c.green(BOX.br)}`);
    console.log('');
}

/**
 * Display QR Code
 * @param {string} qr - QR code string
 */
function displayQRCode(qr) {
    const BOX = { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' };
    
    console.log('');
    console.log(`${c.green(BOX.tl)}${c.green(BOX.h.repeat(45))}${c.green(BOX.tr)}`);
    console.log(`${c.green(BOX.v)}${c.whiteBold('                  QR CODE                   ')}${c.green(BOX.v)}`);
    console.log(`${c.green(BOX.bl)}${c.green(BOX.h.repeat(45))}${c.green(BOX.br)}`);
    console.log('');
    
    // Convert QR to terminal display
    try {
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: true });
    } catch (e) {
        // If qrcode-terminal not available, just show the raw QR data
        console.log(c.gray('Scan QR Code di WhatsApp:'));
        console.log(c.gray('Settings > Linked Devices > Link a Device'));
        console.log('');
        // Show QR in simple format
        const lines = qr.match(/.{1,50}/g) || [qr];
        for (const line of lines.slice(0, 5)) {
            console.log(c.gray(line));
        }
        console.log(c.gray('...'));
    }
    console.log('');
    console.log(c.gray('Scan QR di atas menggunakan WhatsApp'));
    console.log('');
}

/**
 * Ensure session directory exists
 */
function ensureSessionDir() {
    if (!fs.existsSync(SESSION_PATH)) {
        fs.mkdirSync(SESSION_PATH, { recursive: true });
        logger.info('Session directory created');
    }
}

/**
 * Start WhatsApp connection
 * @param {Object} callbacks - Callback functions
 * @returns {Promise<Object>} Socket instance
 */
async function startConnection(callbacks = {}) {
    const {
        onMessage,
        onRawMessage,
        onGroupUpdate,
        onMessageUpdate,
        onGroupSettingsUpdate,
        onConnectionUpdate
    } = callbacks;
    
    ensureSessionDir();
    
    // Get latest Baileys version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.tag('Connection', `Menggunakan WA v${version.join('.')}`, `isLatest: ${isLatest}`);

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    
    // Pino logger untuk Baileys (silent)
    const baileysLogger = pino({ level: 'silent' });
    
    // Create socket
    const sock = makeWASocket({
        version,
        logger: baileysLogger,
        printQRInTerminal: false, // We'll handle QR/pairing ourselves
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, baileysLogger)
        },
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true
    });
    
    // Extend socket with helper methods (sendImageAsSticker, sendVideoAsSticker, etc.)
    extendSocket(sock);
    
    // Check if we need to pair
    const usePairingCode = config.session?.usePairingCode ?? true;
    const pairingNumber = config.session?.pairingNumber;
    
    if (!sock.authState.creds.registered) {
        if (usePairingCode && pairingNumber) {
            // Use pairing code method
            const formattedNumber = formatPhoneNumber(pairingNumber);
            
            if (!formattedNumber) {
                logger.error('Pairing', 'Nomor pairing tidak valid di config.js!');
                logger.info('Pairing', 'Set session.pairingNumber di config.js');
                process.exit(1);
            }
            
            logger.tag('Pairing', `Meminta pairing code untuk ${formattedNumber.substring(0, 4)}...`);
            
            // Wait a bit before requesting pairing code
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            try {
                const code = await sock.requestPairingCode(formattedNumber);
                displayPairingCode(code);
            } catch (error) {
                logger.error('Pairing', `Gagal mendapatkan pairing code: ${error.message}`);
                logger.info('Pairing', 'Pastikan nomor valid dan belum terdaftar');
            }
        } else {
            // Use QR code method
            logger.info('QR Code', 'Menunggu QR code...');
        }
    } else {
        logger.success('Session', 'Session tersimpan ditemukan');
    }
    
    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Handle QR code display
        if (qr && !usePairingCode) {
            displayQRCode(qr);
        }
        
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            
            logConnection('disconnected', `Reason: ${reason}`);
            
            if (shouldReconnect) {
                logger.info('Reconnecting', 'Mencoba menghubungkan ulang...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                return startConnection(callbacks);
            } else {
                logger.warn('LoggedOut', 'Session logged out. Hapus folder session dan pair ulang.');
                
                // Delete session folder
                try {
                    fs.rmSync(SESSION_PATH, { recursive: true, force: true });
                    logger.info('Session', 'Session folder dihapus');
                } catch (e) {}
                
                process.exit(1);
            }
        }
        
        if (connection === 'connecting') {
            logConnection('connecting');
        }
        
        if (connection === 'open') {
            startTime = Date.now();
            
            // Set bot number in config
            if (sock.user?.id) {
                const { setBotNumber } = require('../config');
                setBotNumber(sock.user.id);
            }
            
            // Call user callback
            if (onConnectionUpdate) {
                await onConnectionUpdate(update, sock);
            }
        }
    });
    
    // Credentials update handler
    sock.ev.on('creds.update', saveCreds);
    
    // Messages handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const msg of messages) {
            if (!msg.message) continue;
            
            // Skip status messages
            if (msg.key.remoteJid === 'status@broadcast') continue;
            
            // Call raw message handler first
            if (onRawMessage) {
                try {
                    await onRawMessage(msg, sock);
                } catch (e) {}
            }
            
            // Call message handler
            if (onMessage) {
                try {
                    await onMessage(msg, sock);
                } catch (error) {
                    logger.error('Message', error.message);
                }
            }
        }
    });
    
    // Group participants update handler
    sock.ev.on('group-participants.update', async (update) => {
        if (onGroupUpdate) {
            try {
                await onGroupUpdate(update, sock);
            } catch (error) {
                logger.error('Group', error.message);
            }
        }
    });
    
    // Message update handler (for reactions, delete, etc)
    sock.ev.on('messages.update', async (updates) => {
        if (onMessageUpdate) {
            try {
                await onMessageUpdate(updates, sock);
            } catch (error) {
                logger.error('MessageUpdate', error.message);
            }
        }
    });
    
    // Group settings update handler
    sock.ev.on('groups.update', async (updates) => {
        if (onGroupSettingsUpdate) {
            for (const update of updates) {
                try {
                    await onGroupSettingsUpdate(update, sock);
                } catch (error) {
                    logger.error('GroupSettings', error.message);
                }
            }
        }
    });
    
    // Handle incoming calls (auto reject if configured)
    sock.ev.on('call', async (calls) => {
        if (!config.features?.antiCall) return;
        
        for (const call of calls) {
            if (call.status === 'offer') {
                try {
                    await sock.rejectCall(call.id, call.from);
                    await sock.sendMessage(call.from, {
                        text: '🚫 *Auto Reject Call*\n\n> Maaf, bot tidak menerima panggilan.\n> Silakan kirim pesan saja.'
                    });
                    logger.warn('Call', `Rejected call from ${call.from}`);
                } catch (e) {}
            }
        }
    });
    
    return sock;
}

module.exports = {
    startConnection,
    getUptime
};