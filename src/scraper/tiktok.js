const axios = require('axios')
const https = require('https')

/**
 * TikTok Downloader with multiple fallback APIs
 */

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
})

/**
 * Try multiple APIs to download TikTok video
 */
async function downloadTikTok(url) {
    const apis = [
        () => tryAPI1(url), // tikwm.com
        () => tryAPI2(url), // ttsave style
        () => tryAPI3(url), // musicaldown style
        () => tryAPI4(url)  // ssstik style
    ]

    let lastError = null

    for (const api of apis) {
        try {
            const result = await api()
            if (result && result.success && result.videoUrl) {
                return result
            }
        } catch (err) {
            console.log(`[TikTok] API failed: ${err.message}`)
            lastError = err
        }
    }

    throw lastError || new Error('Semua API TikTok gagal')
}

// API 1: tikwm.com - Most reliable
async function tryAPI1(url) {
    const { data } = await axiosInstance.post('https://tikwm.com/api/', 
        new URLSearchParams({ url, count: 12, cursor: 0, web: 1, hd: 1 }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    if (data?.code === 0 && data?.data) {
        const d = data.data
        return {
            success: true,
            videoUrl: d.hdplay || d.play,
            audioUrl: d.music,
            coverUrl: d.cover,
            title: d.title || '',
            author: {
                name: d.author?.nickname || '',
                username: d.author?.unique_id || ''
            },
            stats: {
                play: d.play_count,
                like: d.digg_count,
                comment: d.comment_count,
                share: d.share_count
            }
        }
    }
    throw new Error('tikwm response invalid')
}

// API 2: Direct API
async function tryAPI2(url) {
    const { data } = await axiosInstance.get(
        `https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`
    )
    
    if (data?.success && data?.token) {
        return {
            success: true,
            videoUrl: `https://tikmate.app/download/${data.token}/video`,
            title: data.author_name || '',
            author: { name: data.author_name || '', username: '' },
            stats: {}
        }
    }
    throw new Error('tikmate response invalid')
}

// API 3: SnapTik style
async function tryAPI3(url) {
    const { data } = await axiosInstance.get(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`
    )
    
    if (data?.data?.play || data?.data?.hdplay) {
        const d = data.data
        return {
            success: true,
            videoUrl: d.hdplay || d.play,
            title: d.title || '',
            author: { name: d.author?.nickname || '', username: d.author?.unique_id || '' },
            stats: {}
        }
    }
    throw new Error('tikwm v2 response invalid')
}

// API 4: SSSTik style
async function tryAPI4(url) {
    const { data } = await axiosInstance.post('https://ssstik.io/abc?url=dl', 
        `id=${encodeURIComponent(url)}&locale=en&tt=aGlsZXM=`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    
    // Parse HTML response for download link
    if (data && typeof data === 'string') {
        const match = data.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/i)
        if (match) {
            return {
                success: true,
                videoUrl: match[1].replace(/&amp;/g, '&'),
                title: '',
                author: { name: '', username: '' },
                stats: {}
            }
        }
    }
    throw new Error('ssstik response invalid')
}

module.exports = { downloadTikTok }
