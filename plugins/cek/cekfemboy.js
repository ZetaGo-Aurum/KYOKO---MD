/**
 * Cek Femboy - KYOKO MD Fun Feature
 * Fixed: Send as IMAGE with proper buffer download
 */

const axios = require('axios');

const pluginConfig = {
    name: 'cekfemboy',
    alias: ['femboy', 'cekfem'],
    category: 'cek',
    description: 'Cek seberapa femboy kamu',
    usage: '.cekfemboy <nama>',
    example: '.cekfemboy Budi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

// API endpoints - these return PNG/JPG which work better in WhatsApp
const IMAGE_APIS = {
    masculine: 'https://api.waifu.pics/sfw/kick',
    cool: 'https://api.waifu.pics/sfw/smug', 
    cute: 'https://api.waifu.pics/sfw/smile',
    pretty: 'https://api.waifu.pics/sfw/blush',
    kawaii: 'https://api.waifu.pics/sfw/happy',
    femboy: 'https://api.waifu.pics/sfw/dance'
};

async function getAnimeImage(category) {
    const apiUrl = IMAGE_APIS[category] || IMAGE_APIS.cute;
    
    try {
        // Get image URL from API
        const { data } = await axios.get(apiUrl, { timeout: 10000 });
        
        if (data?.url) {
            // Download image as buffer
            const imgRes = await axios.get(data.url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            return {
                buffer: Buffer.from(imgRes.data),
                url: data.url
            };
        }
    } catch (e) {
        console.error('Image fetch error:', e.message);
    }
    return null;
}

async function handler(m, { sock }) {
    let nama = m.text?.trim() || m.pushName || 'Kamu';
    
    // Fix: Don't show phone number
    if (/^[\d\s\+\-]+$/.test(nama)) {
        nama = m.pushName || 'Kamu';
    }
    
    try {
        const percent = Math.floor(Math.random() * 101);
        let desc = '';
        let emoji = '';
        let imgCategory = 'cute';
        let character = '';
        
        if (percent < 20) {
            desc = 'ULTRA MASKULIN! Chad energy!';
            emoji = '💪😎';
            imgCategory = 'masculine';
            character = '🔥 SIGMA MALE';
        } else if (percent < 40) {
            desc = 'Cool boy dengan smug face~';
            emoji = '😏';
            imgCategory = 'cool';
            character = '😏 COOL BOY';
        } else if (percent < 60) {
            desc = 'Mulai cute nih, senyum manis!';
            emoji = '😊✨';
            imgCategory = 'cute';
            character = '✨ CUTE BOY';
        } else if (percent < 80) {
            desc = 'Pretty boy! Blushing uwu~';
            emoji = '🌸💕';
            imgCategory = 'pretty';
            character = '💕 PRETTY BOY';
        } else if (percent < 90) {
            desc = 'Kawaii overload! So cute!';
            emoji = '💅✨';
            imgCategory = 'kawaii';
            character = '✨ KAWAII BOY';
        } else {
            desc = 'FEMBOY DEWA TERTINGGI!';
            emoji = '👑💖🔥';
            imgCategory = 'femboy';
            character = '👑 FEMBOY SUPREME';
        }
        
        // Progress bar
        const filled = Math.floor(percent / 10);
        const empty = 10 - filled;
        const bar = '▓'.repeat(filled) + '░'.repeat(empty);
        
        // Build caption
        let txt = `╭──────────────────╮\n`;
        txt += `│  🌸 *ᴄᴇᴋ ꜰᴇᴍʙᴏʏ*\n`;
        txt += `╰──────────────────╯\n\n`;
        txt += `${emoji} *${nama}* ${emoji}\n\n`;
        txt += `> 📊 Level: *${percent}%*\n`;
        txt += `> [${bar}]\n\n`;
        txt += `> 🎭 ${character}\n`;
        txt += `> _${desc}_`;
        
        await m.react('🌸');
        
        // Get anime image
        const imgData = await getAnimeImage(imgCategory);
        
        if (imgData && imgData.buffer && imgData.buffer.length > 1000) {
            // Send as IMAGE (not video) - this saves to device properly
            await sock.sendMessage(m.chat, {
                image: imgData.buffer,
                caption: txt,
                mimetype: 'image/jpeg'
            }, { quoted: m.raw || m });
            
            await m.react('✅');
        } else {
            // Fallback: text only
            await m.reply(txt);
            await m.react('📝');
        }
        
    } catch (err) {
        await m.react('❌');
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
