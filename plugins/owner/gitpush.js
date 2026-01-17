/**
 * GitHub Push - OURIN MD
 * Extract ZIP/archive and push to GitHub repo
 * Uses built-in archiver package (already installed)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const zlib = require('zlib');

const pluginConfig = {
    name: 'gitpush',
    alias: ['pushgithub', 'githubpush', 'pushrepo'],
    category: 'owner',
    description: 'Push file ke GitHub repo (reply ke file)',
    usage: '.gitpush <owner/repo> [branch] [commit-message]',
    example: '.gitpush username/myrepo main "Update files"',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    limit: 0,
    isEnabled: true
};

const { getDatabase } = require('../../src/lib/database');

async function handler(m, { sock, db }) {
    // Check if replying to document
    if (!m.quoted || !m.quoted.isDocument) {
        return m.reply(`❌ Reply ke file untuk push ke GitHub!\n\nFormat: .gitpush <owner/repo> [branch] [commit]\n\nContoh: .gitpush username/myrepo main "Update"`);
    }
    
    const args = m.text?.trim()?.split(' ') || [];
    const repoPath = args[0];
    
    if (!repoPath || !repoPath.includes('/')) {
        return m.reply(`❌ Format: .gitpush <owner/repo>\n\nContoh: .gitpush username/myrepo`);
    }
    
    const [owner, repo] = repoPath.split('/');
    const branch = args[1] || 'main';
    const commitMsg = args.slice(2).join(' ') || `Update via OURIN MD - ${new Date().toISOString()}`;
    
    // Get GitHub token from settings
    const settings = db.db?.data?.settings || {};
    const githubToken = settings.githubToken;
    
    if (!githubToken) {
        return m.reply(`❌ GitHub token belum di-set!\n\nGunakan: .setgithubtoken <token>\n\n> Token bisa didapat dari GitHub Settings → Developer Settings → Personal Access Tokens`);
    }
    
    await m.reply(`📦 *ɢɪᴛʜᴜʙ ᴘᴜꜱʜ*\n\n⏳ Processing...\n\n◦ Repo: ${owner}/${repo}\n◦ Branch: ${branch}\n◦ Message: ${commitMsg}`);
    
    try {
        // Download the file
        const buffer = await m.quoted.download();
        const fileName = m.quoted.fileName || 'file';
        
        // Get file extension
        const ext = path.extname(fileName).toLowerCase();
        
        // For now, only support single file upload (not ZIP extraction)
        // This avoids the adm-zip dependency
        const content = buffer.toString('base64');
        
        // Get existing file SHA if exists
        let sha = null;
        try {
            const existingFile = await githubApiRequest(
                'GET',
                `/repos/${owner}/${repo}/contents/${fileName}?ref=${branch}`,
                null,
                githubToken
            );
            if (existingFile.sha) {
                sha = existingFile.sha;
            }
        } catch (e) {
            // File doesn't exist, that's okay
        }
        
        // Create or update file
        const payload = {
            message: commitMsg,
            content: content,
            branch: branch
        };
        if (sha) payload.sha = sha;
        
        await githubApiRequest(
            'PUT',
            `/repos/${owner}/${repo}/contents/${fileName}`,
            payload,
            githubToken
        );
        
        let txt = `✅ *ɢɪᴛʜᴜʙ ᴘᴜꜱʜ ᴄᴏᴍᴘʟᴇᴛᴇ*\n\n`;
        txt += `📦 Repo: \`${owner}/${repo}\`\n`;
        txt += `🌿 Branch: ${branch}\n`;
        txt += `📄 File: ${fileName}\n`;
        txt += `\n🔗 https://github.com/${owner}/${repo}`;
        
        await m.reply(txt);
        
    } catch (error) {
        await m.reply(`❌ Push gagal: ${error.message}`);
    }
}

function githubApiRequest(method, endpoint, data, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: endpoint,
            method: method,
            headers: {
                'User-Agent': 'OURIN-MD/1.0',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(json.message || 'API Error'));
                    }
                } catch (e) {
                    resolve(body);
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

module.exports = { config: pluginConfig, handler };
