const pluginConfig = {
    name: 'siapa',
    alias: ['who'],
    category: 'fun',
    description: 'Tanya bot siapa seseorang',
    usage: '.siapa <pertanyaan>',
    example: '.siapa jodohku?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

const answers = [
    'Orang yang kamu pikirkan sekarang!',
    'Hmm, seseorang yang dekat denganmu.',
    'Orang yang tidak kamu duga!',
    'Aku nggak tau, coba pikir lagi.',
    'Seseorang yang sudah ada di hidupmu.',
    'Orang yang selalu mendukungmu.',
    'Mungkin orang yang baru kamu kenal?',
    'Orang yang selalu bikin kamu senyum.',
    'Hmm, misteri nih.',
    'Seseorang dengan inisial huruf A-Z.',
    'Orang yang paling nggak kamu sangka!',
    'Kamu sendiri!',
    'Orang yang ada di sekitarmu sekarang.',
    'Seseorang yang spesial.',
    'Hmm, aku rasa kamu sudah tau jawabannya.',
    'Orang yang setia padamu.',
    'Seseorang yang sedang memikirkanmu juga.',
    'Coba lihat ke samping kirimu!',
    'Orang yang sering chat sama kamu.',
    'Itu rahasia!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`👤 *sɪᴀᴘᴀ*\n\n> Masukkan pertanyaan!\n\n*Contoh:*\n> .siapa jodohku?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`👤 *ᴘᴇʀᴛᴀɴʏᴀᴀɴ*\n> ${text}\n\n🎱 *ᴊᴀᴡᴀʙᴀɴ*\n> ${answer}`);
}

module.exports = {
    config: pluginConfig,
    handler
};
