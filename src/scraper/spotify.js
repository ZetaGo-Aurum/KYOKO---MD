/**
 * Spotify Scraper - KYOKO MD
 * Alternative implementation without bycf dependency
 * Uses public APIs for Spotify download
 * Developer: ZetaGo-Aurum
 */

const axios = require("axios");

const CONFIG = {
    HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
};

const getTrackId = (url) => {
    const match = url.match(/(?:track|id)\/([a-zA-Z0-9]{22})/);
    return match ? match[1] : url;
};

const spotify = {
    /**
     * Search Spotify tracks using public API
     */
    search: async (query) => {
        try {
            const { data } = await axios.get(
                `https://api.fabdl.com/spotify/search?query=${encodeURIComponent(query)}`,
                { headers: CONFIG.HEADERS, timeout: 15000 }
            );
            
            if (data.result && data.result.tracks) {
                return {
                    status: true,
                    result: data.result.tracks.map(t => ({
                        title: t.name,
                        artist: t.artists,
                        url: `https://open.spotify.com/track/${t.id}`,
                        id: t.id,
                        duration: t.duration_ms,
                        image: t.image
                    }))
                };
            }
            return { status: false, msg: 'No results found' };
        } catch (error) {
            console.error(`[Spotify Search] Error: ${error.message}`);
            return { status: false, msg: error.message };
        }
    },

    /**
     * Download Spotify track
     */
    download: async (urlOrId) => {
        try {
            const trackId = getTrackId(urlOrId);
            
            // Method 1: Try fabdl.com API
            try {
                const getUrl = `https://api.fabdl.com/spotify/get?url=https://open.spotify.com/track/${trackId}`;
                const { data: trackData } = await axios.get(getUrl, { 
                    headers: CONFIG.HEADERS, 
                    timeout: 15000 
                });
                
                if (trackData.result) {
                    const { result } = trackData;
                    const gid = result.gid;
                    const taskId = result.id;
                    
                    // Get download link
                    const convertUrl = `https://api.fabdl.com/spotify/mp3-convert-task/${gid}/${taskId}`;
                    const { data: convertData } = await axios.get(convertUrl, { 
                        headers: CONFIG.HEADERS, 
                        timeout: 30000 
                    });
                    
                    if (convertData.result && convertData.result.download_url) {
                        return {
                            status: true,
                            metadata: {
                                title: result.name || result.title,
                                artist: result.artists || 'Unknown',
                                album: result.album || 'Unknown',
                                cover: result.image || '',
                                releaseDate: result.release_date || '',
                                duration: result.duration_ms
                            },
                            download: {
                                mp3: `https://api.fabdl.com${convertData.result.download_url}`,
                                flac: null
                            }
                        };
                    }
                }
            } catch (fabdlError) {
                console.log('[Spotify] fabdl method failed, trying alternative...');
            }
            
            // Method 2: Try spotifydown.com API
            try {
                const { data: spotifyDown } = await axios.get(
                    `https://api.spotifydown.com/download/${trackId}`,
                    {
                        headers: {
                            ...CONFIG.HEADERS,
                            'Origin': 'https://spotifydown.com',
                            'Referer': 'https://spotifydown.com/'
                        },
                        timeout: 20000
                    }
                );
                
                if (spotifyDown.success && spotifyDown.link) {
                    return {
                        status: true,
                        metadata: {
                            title: spotifyDown.metadata?.title || spotifyDown.title || 'Unknown',
                            artist: spotifyDown.metadata?.artists || spotifyDown.artists || 'Unknown',
                            album: spotifyDown.metadata?.album || 'Unknown',
                            cover: spotifyDown.metadata?.cover || spotifyDown.cover || '',
                            releaseDate: ''
                        },
                        download: {
                            mp3: spotifyDown.link,
                            flac: null
                        }
                    };
                }
            } catch (spotifydownError) {
                console.log('[Spotify] spotifydown method failed');
            }
            
            // Method 3: Try ssyoutube/savefrom style API
            try {
                const { data: altData } = await axios.get(
                    `https://api.downloaderbot.com/spotify/download?url=https://open.spotify.com/track/${trackId}`,
                    { headers: CONFIG.HEADERS, timeout: 20000 }
                );
                
                if (altData.status && altData.data?.link) {
                    return {
                        status: true,
                        metadata: {
                            title: altData.data.title || 'Unknown',
                            artist: altData.data.artist || 'Unknown',
                            album: altData.data.album || 'Unknown',
                            cover: altData.data.cover || '',
                            releaseDate: ''
                        },
                        download: {
                            mp3: altData.data.link,
                            flac: null
                        }
                    };
                }
            } catch (altError) {
                console.log('[Spotify] Alternative method failed');
            }
            
            return { status: false, msg: 'Semua metode download gagal. Coba lagi nanti.' };

        } catch (error) {
            console.error(`[Spotify Download] Error: ${error.message}`);
            return { status: false, msg: error.message };
        }
    }
};

module.exports = spotify;