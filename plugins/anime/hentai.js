/**
 * Hentai / NSFW Anime Images - KYOKO MD Feature
 * 🔞 18+ ONLY - Age restricted content
 * Developer: ZetaGo-Aurum
 * 
 * Using multiple reliable API sources
 */

const https = require('https');
const http = require('http');

const pluginConfig = {
    name: 'hentai',
    alias: ['nsfw', 'nsfwwaifu', 'lewdwaifu', 'ecchi', '18+'],
    category: 'anime',
    description: '🔞 [18+] Random gambar NSFW waifu/neko',
    usage: '.hentai <category>',
    example: '.hentai waifu',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true,
    isNSFW: true
};

// Available NSFW categories
const NSFW_CATEGORIES = ['waifu', 'neko', 'trap', 'blowjob'];

// Global pending confirmations
const pendingConfirmations = new Map();
global.hentaiPending = pendingConfirmations;

// Simple fetch with longer timeout
function fetchJSON(url, timeout = 45000) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON'));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Fetch NSFW image from multiple sources
async function fetchNSFWImage(category) {
    const apis = [
        {
            url: `https://api.waifu.pics/nsfw/${category}`,
            extract: (data) => data?.url
        },
        {
            url: `https://nekos.life/api/v2/img/${category === 'waifu' ? 'ero' : 'lewd'}`,
            extract: (data) => data?.url
        },
        {
            url: 'https://api.nekos.dev/api/v3/images/nsfw/gif/neko/',
            extract: (data) => data?.data?.response?.url
        }
    ];
    
    for (const api of apis) {
        try {
            const data = await fetchJSON(api.url);
            const imageUrl = api.extract(data);
            if (imageUrl && imageUrl.startsWith('http')) {
                return imageUrl;
            }
        } catch (e) {
            continue;
        }
    }
    
    // Fallback: direct image URLs (safe fallback)
    const fallbackImages = {
        waifu: 'https://i.waifu.pics/~rPYhM~.jpg',
        neko: 'https://i.waifu.pics/r~cX-Tw.jpg',
        trap: 'https://i.waifu.pics/vGQF~G-.jpg',
        blowjob: 'https://i.waifu.pics/b6xDuET.jpg'
    };
    
    return fallbackImages[category] || fallbackImages.waifu;
}

// Export function to send NSFW image
async function sendNSFWImage(m, sock, category) {
    try {
        const imageUrl = await fetchNSFWImage(category);
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `🔞 *ɴsꜰᴡ ${category.toUpperCase()}*\n\n` +
                     `> 📁 Category: ${category}\n` +
                     `> ⚠️ _18+ Content Only_\n\n` +
                     `> _Powered by waifu.pics_`
        }, { quoted: m.raw || m });
        
        return true;
    } catch (error) {
        await m.reply(`❌ Gagal: ${error.message}`);
        return false;
    }
}

module.exports.sendNSFWImage = sendNSFWImage;
module.exports.pendingConfirmations = pendingConfirmations;

async function handler(m, { sock, db }) {
    const arg = m.text?.trim()?.toLowerCase() || '';
    const prefix = m.prefix || '.';
    
    // Show tutorial if no category specified
    if (!arg) {
        return m.reply(
`╭─────────────────╮
│  🔞 *ɴsꜰᴡ ɪᴍᴀɢᴇ*
╰─────────────────╯

> Konten khusus *18+ ONLY*

*📋 Kategori:*
> ${prefix}hentai waifu
> ${prefix}hentai neko
> ${prefix}hentai trap
> ${prefix}hentai blowjob

*📖 Cara Pakai:*
> 1. Ketik perintah
> 2. Bot tampilkan konfirmasi
> 3. *REPLY* dengan ya/tidak

> ⚠️ _Premium only_`
        );
    }
    
    // Check if category is valid
    if (!NSFW_CATEGORIES.includes(arg)) {
        return m.reply(
`❌ Kategori tidak valid!

> Gunakan: waifu, neko, trap, blowjob

> Contoh: ${prefix}hentai waifu`
        );
    }
    
    // Send confirmation
    const sentMsg = await sock.sendMessage(m.chat, {
        text: `╭─────────────────╮
│  🔞 *ᴘᴇʀɪɴɢᴀᴛᴀɴ 18+*
╰─────────────────╯

> Konten ini HANYA untuk
> pengguna berusia *18+*

> Dengan melanjutkan, kamu
> menyatakan sudah dewasa.

> 📁 Category: *${arg}*

*Apakah kamu berusia 18+?*

> *REPLY* pesan ini dengan:
> ✅ *ya* untuk melanjutkan
> ❌ *tidak* untuk batal

> ⏰ _Berlaku 2 menit_`
    }, { quoted: m.raw || m });
    
    // Store pending
    const msgId = sentMsg.key.id;
    pendingConfirmations.set(msgId, {
        category: arg,
        chatId: m.chat,
        sender: m.sender,
        timestamp: Date.now()
    });
    
    setTimeout(() => pendingConfirmations.delete(msgId), 120000);
}

module.exports.config = pluginConfig;
module.exports.handler = handler;
