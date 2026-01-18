const ytdl = require('@distube/ytdl-core')
const yts = require('yt-search')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

/**
 * YouTube Downloader with anti-bot bypass
 * Uses cookies and fallback APIs to avoid YouTube bot detection
 */

require('dotenv').config()

// Read cookies from environment or file
function getCookies() {
    // Check for cookie in .env
    const envCookie = process.env.YOUTUBE_COOKIE
    if (envCookie) return envCookie
    
    // Check for cookies.txt file
    const cookiePath = path.join(process.cwd(), 'cookies.txt')
    if (fs.existsSync(cookiePath)) {
        return fs.readFileSync(cookiePath, 'utf-8').trim()
    }
    
    return null
}

// Create agent with cookies for authentication
function createAgent() {
    const cookies = getCookies()
    if (cookies) {
        try {
            console.log('[YouTube] Using cookies for authentication...')
            return ytdl.createAgent(cookies.split(';').map(c => {
                const [name, value] = c.trim().split('=')
                return { name, value, domain: '.youtube.com' }
            }))
        } catch (e) {
            console.log('[YouTube] Cookie parsing failed:', e.message)
        }
    }
    return undefined
}

class YouTubeDownloader {
    constructor() {
        this.tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true })
        }
        this.agent = createAgent()
    }

    validateURL(url) {
        return ytdl.validateURL(url) || /youtu\.?be/i.test(url)
    }

    getVideoId(url) {
        try {
            return ytdl.getVideoID(url)
        } catch (e) {
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/)
            return match ? match[1] : null
        }
    }

    normalizeUrl(url) {
        const videoId = this.getVideoId(url)
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`
        return url
    }

    /**
     * Download video - tries ytdl-core first, then fallback APIs
     */
    async downloadVideo(url, quality = '720') {
        const fullUrl = this.normalizeUrl(url)
        const videoId = this.getVideoId(fullUrl)
        
        // Try ytdl-core first
        try {
            console.log('[YouTube] Trying ytdl-core with agent...')
            return await this.ytdlDownloadVideo(fullUrl)
        } catch (err) {
            console.log('[YouTube] ytdl-core failed:', err.message)
        }
        
        // Fallback to cobalt.tools
        try {
            console.log('[YouTube] Trying cobalt.tools API...')
            return await this.cobaltDownload(fullUrl, 'video')
        } catch (err) {
            console.log('[YouTube] cobalt failed:', err.message)
        }
        
        // Fallback to saveservall
        try {
            console.log('[YouTube] Trying saveservall API...')
            return await this.saveservallDownload(videoId, 'video')
        } catch (err) {
            console.log('[YouTube] saveservall failed:', err.message)
        }
        
        throw new Error('Semua metode download gagal. Coba lagi nanti.')
    }

    /**
     * Download audio - tries ytdl-core first, then fallback APIs
     */
    async downloadAudio(url, bitrate = '128') {
        const fullUrl = this.normalizeUrl(url)
        const videoId = this.getVideoId(fullUrl)
        
        // Try ytdl-core first
        try {
            console.log('[YouTube] Trying ytdl-core audio with agent...')
            return await this.ytdlDownloadAudio(fullUrl)
        } catch (err) {
            console.log('[YouTube] ytdl-core audio failed:', err.message)
        }
        
        // Fallback to cobalt.tools
        try {
            console.log('[YouTube] Trying cobalt.tools audio API...')
            return await this.cobaltDownload(fullUrl, 'audio')
        } catch (err) {
            console.log('[YouTube] cobalt audio failed:', err.message)
        }
        
        // Fallback to saveservall
        try {
            console.log('[YouTube] Trying saveservall audio API...')
            return await this.saveservallDownload(videoId, 'audio')
        } catch (err) {
            console.log('[YouTube] saveservall audio failed:', err.message)
        }
        
        throw new Error('Semua metode download audio gagal.')
    }

    /**
     * ytdl-core video download
     */
    async ytdlDownloadVideo(url) {
        const options = {
            quality: 'highest',
            filter: format => format.hasVideo && format.hasAudio
        }
        if (this.agent) options.agent = this.agent
        
        const info = await ytdl.getInfo(url, { agent: this.agent })
        const title = info.videoDetails.title || 'YouTube Video'
        
        const format = ytdl.chooseFormat(info.formats, options) || 
                       ytdl.chooseFormat(info.formats, { quality: 'highest' })
        
        if (!format) throw new Error('No format found')
        
        const chunks = []
        const stream = ytdl.downloadFromInfo(info, { format, agent: this.agent })
        
        return new Promise((resolve, reject) => {
            stream.on('data', chunk => chunks.push(chunk))
            stream.on('end', () => {
                const buffer = Buffer.concat(chunks)
                console.log(`[YouTube] ✓ Downloaded ${buffer.length} bytes`)
                resolve({ success: true, buffer, title, format: format.qualityLabel || 'HD' })
            })
            stream.on('error', reject)
        })
    }

    /**
     * ytdl-core audio download
     */
    async ytdlDownloadAudio(url) {
        const options = { quality: 'highestaudio', filter: 'audioonly' }
        if (this.agent) options.agent = this.agent
        
        const info = await ytdl.getInfo(url, { agent: this.agent })
        const title = info.videoDetails.title || 'YouTube Audio'
        
        const format = ytdl.chooseFormat(info.formats, options)
        if (!format) throw new Error('No audio format found')
        
        const chunks = []
        const stream = ytdl.downloadFromInfo(info, { format, agent: this.agent })
        
        return new Promise((resolve, reject) => {
            stream.on('data', chunk => chunks.push(chunk))
            stream.on('end', () => {
                const buffer = Buffer.concat(chunks)
                console.log(`[YouTube] ✓ Downloaded audio ${buffer.length} bytes`)
                resolve({ success: true, buffer, title, bitrate: format.audioBitrate || 128 })
            })
            stream.on('error', reject)
        })
    }

    /**
     * Cobalt.tools API - reliable fallback
     */
    async cobaltDownload(url, type = 'video') {
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: '720',
            aFormat: 'mp3',
            isAudioOnly: type === 'audio'
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 60000
        })
        
        if (response.data?.status === 'stream' || response.data?.status === 'redirect') {
            const downloadUrl = response.data.url
            const mediaResponse = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 120000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            })
            
            console.log(`[YouTube] ✓ Cobalt downloaded ${mediaResponse.data.length} bytes`)
            return {
                success: true,
                buffer: Buffer.from(mediaResponse.data),
                title: 'YouTube',
                format: type === 'audio' ? 'mp3' : '720p'
            }
        }
        
        throw new Error(response.data?.text || 'Cobalt API failed')
    }

    /**
     * SaveServAll API fallback
     */
    async saveservallDownload(videoId, type = 'video') {
        const { data } = await axios.get(
            `https://api.saveservall.xyz/youtube?id=${videoId}&type=${type === 'audio' ? 'audio' : 'video360'}`,
            {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 60000
            }
        )
        
        if (data?.url) {
            const mediaResponse = await axios.get(data.url, {
                responseType: 'arraybuffer',
                timeout: 120000
            })
            
            console.log(`[YouTube] ✓ SaveServAll downloaded ${mediaResponse.data.length} bytes`)
            return {
                success: true,
                buffer: Buffer.from(mediaResponse.data),
                title: data.title || 'YouTube',
                format: type === 'audio' ? 'mp3' : '360p'
            }
        }
        
        throw new Error('SaveServAll API failed')
    }

    async search(query, limit = 10) {
        try {
            const results = await yts(query)
            return { 
                success: true, 
                videos: results.videos.slice(0, limit).map(v => ({
                    title: v.title,
                    url: v.url,
                    duration: v.duration.timestamp,
                    views: v.views,
                    author: v.author?.name,
                    thumbnail: v.thumbnail
                }))
            }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }
}

module.exports = YouTubeDownloader