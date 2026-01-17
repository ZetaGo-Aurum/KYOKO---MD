/**
 * Set GitHub Token - KYOKO MD Feature
 * Set GitHub personal access token for gitpush
 * Developer: ZetaGo-Aurum
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'setgithubtoken',
    alias: ['setghtoken', 'githubtoken'],
    category: 'owner',
    description: 'Set GitHub personal access token',
    usage: '.setgithubtoken <token>',
    example: '.setgithubtoken ghp_xxxxxxxxxxxxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const token = m.text?.trim();
    
    if (!token) {
        return m.reply(`❌ Format: .setgithubtoken <token>\n\n` +
            `Cara mendapatkan token:\n` +
            `1. Buka https://github.com/settings/tokens\n` +
            `2. Generate new token (classic)\n` +
            `3. Pilih scope: repo (full control)\n` +
            `4. Copy token yang dihasilkan`);
    }
    
    // Validate token format
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        return m.reply(`⚠️ Token format tidak valid. Token harus dimulai dengan 'ghp_' atau 'github_pat_'`);
    }
    
    // Save token
    db.setting('githubToken', token);
    
    // Delete the message containing token for security
    try {
        await sock.sendMessage(m.chat, { delete: m.key });
    } catch (e) {}
    
    await m.reply(`✅ GitHub token berhasil disimpan!\n\n> Pesan dengan token telah dihapus untuk keamanan.\n> Gunakan \`.gitpush\` untuk push ke GitHub.`);
}

module.exports = { config: pluginConfig, handler };
