const axios = require('axios')
const https = require('https')

/**
 * TikTok Downloader with multiple fallback APIs
 * Returns FULL URLs (not relative paths)
 */

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
})

const TIKWM_BASE = 'https://tikwm.com'

/**
 * Ensure URL is absolute (not relative)
 */
function ensureAbsoluteUrl(url, base = TIKWM_BASE) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
    }
    // Handle relative paths like /video/media/...
    if (url.startsWith('/')) {
        return base + url
    }
    return url
}

/**
 * Download video as buffer from URL
 */
async function downloadVideoBuffer(videoUrl) {
    const response = await axiosInstance.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 60000
    })
    return Buffer.from(response.data)
}

/**
 * Try multiple APIs to download TikTok video
 */
async function downloadTikTok(url) {
    const apis = [
        () => tryAPI1(url), // tikwm.com
        () => tryAPI2(url), // tikmate
        () => tryAPI3(url), // tikwm GET
        () => tryAPI4(url)  // ssstik style
    ]

    let lastError = null

    for (const api of apis) {
        try {
            const result = await api()
            if (result && result.success && result.videoUrl) {
                // Ensure URL is absolute
                result.videoUrl = ensureAbsoluteUrl(result.videoUrl)
                if (result.audioUrl) result.audioUrl = ensureAbsoluteUrl(result.audioUrl)
                if (result.coverUrl) result.coverUrl = ensureAbsoluteUrl(result.coverUrl)
                
                console.log(`[TikTok] Got video URL: ${result.videoUrl?.substring(0, 50)}...`)
                return result
            }
        } catch (err) {
            console.log(`[TikTok] API failed: ${err.message}`)
            lastError = err
        }
    }

    throw lastError || new Error('Semua API TikTok gagal')
}

/**
 * Download TikTok as Buffer (for plugins that need buffer)
 */
async function downloadTikTokBuffer(url) {
    const result = await downloadTikTok(url)
    if (result.success && result.videoUrl) {
        result.buffer = await downloadVideoBuffer(result.videoUrl)
    }
    return result
}

// API 1: tikwm.com POST - Most reliable
async function tryAPI1(url) {
    console.log('[TikTok] Trying tikwm.com POST API...')
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

// API 2: tikmate
async function tryAPI2(url) {
    console.log('[TikTok] Trying tikmate API...')
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

// API 3: tikwm GET
async function tryAPI3(url) {
    console.log('[TikTok] Trying tikwm.com GET API...')
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
    console.log('[TikTok] Trying ssstik API...')
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

module.exports = { 
    downloadTikTok,
    downloadTikTokBuffer,
    downloadVideoBuffer
}
