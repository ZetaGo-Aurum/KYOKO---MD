const ytdl = require('@distube/ytdl-core')
const yts = require('yt-search')
const fs = require('fs')
const path = require('path')

/**
 * YouTube Downloader using @distube/ytdl-core
 * This is a maintained fork of ytdl-core with better reliability
 */
class YouTubeDownloader {
    constructor() {
        this.tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true })
        }
    }

    validateURL(url) {
        return ytdl.validateURL(url)
    }

    getVideoId(url) {
        try {
            return ytdl.getVideoID(url)
        } catch (e) {
            return null
        }
    }

    normalizeUrl(url) {
        const videoId = this.getVideoId(url)
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`
        return url
    }

    async getInfo(url) {
        try {
            const videoId = this.getVideoId(url)
            if (!videoId) return { success: false, error: 'Invalid URL' }
            
            const info = await ytdl.getInfo(url)
            return {
                success: true,
                videoId,
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails?.[0]?.url,
                author: info.videoDetails.author?.name,
                duration: info.videoDetails.lengthSeconds,
                viewCount: info.videoDetails.viewCount
            }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }

    /**
     * Download video as buffer
     */
    async downloadVideo(url, quality = '720') {
        const fullUrl = this.normalizeUrl(url)
        
        console.log('[YouTubeDownloader] Downloading video with ytdl-core...')
        
        try {
            const info = await ytdl.getInfo(fullUrl)
            const title = info.videoDetails.title || 'YouTube Video'
            
            // Get best video+audio format
            const format = ytdl.chooseFormat(info.formats, { 
                quality: 'highestvideo',
                filter: format => format.hasVideo && format.hasAudio
            }) || ytdl.chooseFormat(info.formats, {
                quality: 'highest'
            })
            
            if (!format) {
                throw new Error('No suitable format found')
            }
            
            // Download as buffer
            const chunks = []
            const stream = ytdl.downloadFromInfo(info, { format })
            
            return new Promise((resolve, reject) => {
                stream.on('data', chunk => chunks.push(chunk))
                stream.on('end', () => {
                    const buffer = Buffer.concat(chunks)
                    console.log(`[YouTubeDownloader] ✓ Downloaded ${buffer.length} bytes`)
                    resolve({
                        success: true,
                        buffer,
                        title,
                        format: format.qualityLabel || format.quality
                    })
                })
                stream.on('error', reject)
            })
            
        } catch (err) {
            console.error('[YouTubeDownloader] Error:', err.message)
            throw new Error(`YouTube download error: ${err.message}`)
        }
    }

    /**
     * Download audio as buffer
     */
    async downloadAudio(url, bitrate = '128') {
        const fullUrl = this.normalizeUrl(url)
        
        console.log('[YouTubeDownloader] Downloading audio with ytdl-core...')
        
        try {
            const info = await ytdl.getInfo(fullUrl)
            const title = info.videoDetails.title || 'YouTube Audio'
            
            // Get best audio format
            const format = ytdl.chooseFormat(info.formats, { 
                quality: 'highestaudio',
                filter: 'audioonly'
            })
            
            if (!format) {
                throw new Error('No audio format found')
            }
            
            // Download as buffer
            const chunks = []
            const stream = ytdl.downloadFromInfo(info, { format })
            
            return new Promise((resolve, reject) => {
                stream.on('data', chunk => chunks.push(chunk))
                stream.on('end', () => {
                    const buffer = Buffer.concat(chunks)
                    console.log(`[YouTubeDownloader] ✓ Downloaded audio ${buffer.length} bytes`)
                    resolve({
                        success: true,
                        buffer,
                        title,
                        bitrate: format.audioBitrate || 128
                    })
                })
                stream.on('error', reject)
            })
            
        } catch (err) {
            console.error('[YouTubeDownloader] Audio Error:', err.message)
            throw new Error(`YouTube audio error: ${err.message}`)
        }
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