const axios = require('axios')
const https = require('https')
const yts = require('yt-search')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

/**
 * YouTube Downloader using multiple free APIs
 * Vevioz, yt5s, ssyoutube - all provide direct links
 */
class YouTubeDownloader {
    constructor() {
        this.axios = axios.create({
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })
        
        this.tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true })
        }
    }

    validateURL(url) {
        return /youtu\.?be/i.test(url)
    }

    getVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /[?&]v=([a-zA-Z0-9_-]{11})/
        ]
        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) return match[1]
        }
        return null
    }

    normalizeUrl(url) {
        const videoId = this.getVideoId(url)
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`
        return url
    }

    async getInfo(url) {
        const videoId = this.getVideoId(url)
        if (!videoId) return { success: false, error: 'Invalid URL' }
        try {
            const result = await yts({ videoId })
            return { success: true, videoId, title: result.title, thumbnail: result.thumbnail, author: result.author?.name }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }

    async downloadVideo(url, quality = '720') {
        const fullUrl = this.normalizeUrl(url)
        const videoId = this.getVideoId(fullUrl)
        if (!videoId) throw new Error('Video ID tidak ditemukan')

        const methods = [
            () => this.veviozMethod(videoId, 'mp4'),
            () => this.yt5sMethod(fullUrl, 'mp4'),
            () => this.y2mateMethod(fullUrl, 'mp4')
        ]

        for (const method of methods) {
            try {
                const result = await method()
                if (result?.success && result?.url) {
                    console.log('[YouTubeDownloader] Got direct download URL')
                    return result
                }
            } catch (err) {
                console.log(`[YouTubeDownloader] Method failed: ${err.message}`)
            }
        }

        throw new Error('Semua API gagal. Coba lagi nanti.')
    }

    async downloadAudio(url, bitrate = '128') {
        const fullUrl = this.normalizeUrl(url)
        const videoId = this.getVideoId(fullUrl)
        if (!videoId) throw new Error('Video ID tidak ditemukan')

        const methods = [
            () => this.veviozMethod(videoId, 'mp3'),
            () => this.yt5sMethod(fullUrl, 'mp3'),
            () => this.y2mateMethod(fullUrl, 'mp3')
        ]

        for (const method of methods) {
            try {
                const result = await method()
                if (result?.success && result?.url) {
                    console.log('[YouTubeDownloader] Got direct audio URL')
                    return result
                }
            } catch (err) {
                console.log(`[YouTubeDownloader] Audio method failed: ${err.message}`)
            }
        }

        throw new Error('Semua API audio gagal.')
    }

    /**
     * Vevioz API - returns direct embed link
     */
    async veviozMethod(videoId, format) {
        console.log('[YouTubeDownloader] Trying Vevioz API...')
        
        // Get the button page
        const { data: html } = await this.axios.get(
            `https://api.vevioz.com/api/button/${format}/${videoId}`,
            { headers: { 'Accept': 'text/html' } }
        )
        
        const $ = cheerio.load(html)
        
        // Find download link
        let downloadUrl = null
        let title = 'YouTube'
        
        // Try different selectors
        $('a.download-btn, a[download], a[href*="download"], a[href*=".mp3"], a[href*=".mp4"]').each((i, el) => {
            const href = $(el).attr('href')
            if (href && href.startsWith('http')) {
                downloadUrl = href
                return false // break
            }
        })
        
        // Try data attributes
        if (!downloadUrl) {
            $('button[data-url], a[data-url]').each((i, el) => {
                const dataUrl = $(el).attr('data-url')
                if (dataUrl) {
                    downloadUrl = dataUrl
                    return false
                }
            })
        }

        // Get title
        const titleEl = $('title, h1, .title').first().text()
        if (titleEl) title = titleEl.replace(/\s*-\s*vevioz/i, '').trim()
        
        if (downloadUrl) {
            return { success: true, url: downloadUrl, title }
        }
        
        throw new Error('Vevioz: No download link found')
    }

    /**
     * yt5s.biz API - alternate source
     */
    async yt5sMethod(url, format) {
        console.log('[YouTubeDownloader] Trying yt5s API...')
        
        // Step 1: Analyze video
        const { data: analyzeData } = await this.axios.post('https://yt5s.biz/mates/analyzeV2/ajax', 
            new URLSearchParams({
                k_query: url,
                k_page: 'home',
                hl: 'en',
                q_auto: 0
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        
        if (!analyzeData?.links) throw new Error('yt5s: No links')
        
        const links = analyzeData.links[format] || {}
        const linkKeys = Object.keys(links)
        
        if (linkKeys.length === 0) throw new Error('yt5s: No format links')
        
        // Get first available quality
        const firstKey = linkKeys[0]
        const linkInfo = links[firstKey]
        
        // Step 2: Convert
        const { data: convertData } = await this.axios.post('https://yt5s.biz/mates/convertV2/index',
            new URLSearchParams({
                vid: analyzeData.vid,
                k: linkInfo.k
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        
        if (convertData?.dlink) {
            return { success: true, url: convertData.dlink, title: analyzeData.title }
        }
        
        throw new Error('yt5s: Convert failed')
    }

    /**
     * y2mate.nu API (different from .com)
     */
    async y2mateMethod(url, format) {
        console.log('[YouTubeDownloader] Trying y2mate.nu API...')
        
        const { data } = await this.axios.post('https://www.y2mate.nu/mates/en/analyze/ajax',
            new URLSearchParams({
                url: url,
                q_auto: 1,
                ajax: 1
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        
        if (data?.result) {
            const $ = cheerio.load(data.result)
            let downloadUrl = null
            
            const selector = format === 'mp3' ? 'a[href*="mp3"]' : 'a[href*="mp4"]'
            $(selector + ', a.btn-success, a[download]').each((i, el) => {
                const href = $(el).attr('href')
                if (href && href.startsWith('http')) {
                    downloadUrl = href
                    return false
                }
            })
            
            if (downloadUrl) {
                return { success: true, url: downloadUrl, title: 'YouTube' }
            }
        }
        
        throw new Error('y2mate.nu: No result')
    }

    async search(query, limit = 10) {
        const results = await yts(query)
        return { success: true, videos: results.videos.slice(0, limit) }
    }

    cleanup(filePath) {
        try {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
        } catch (e) {}
    }
}

module.exports = YouTubeDownloader