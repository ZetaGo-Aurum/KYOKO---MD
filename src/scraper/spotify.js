/**
 * Spotify Scraper - KYOKO MD
 * Multi-API fallback for reliability
 */

const axios = require("axios");

const CONFIG = {
    HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
    }
};

const getTrackId = (url) => {
    const match = url.match(/(?:track|id)\/([a-zA-Z0-9]{22})/);
    return match ? match[1] : url;
};

const spotify = {
    /**
     * Search Spotify tracks
     */
    search: async (query) => {
        try {
            // Try spotisongdownloader
            const { data } = await axios.get(
                `https://api.spotisongdownloader.com/getResults.php?query=${encodeURIComponent(query)}`,
                { headers: CONFIG.HEADERS, timeout: 15000 }
            );
            
            if (data?.results) {
                return {
                    status: true,
                    result: data.results.map(t => ({
                        title: t.name,
                        artist: t.artist,
                        url: t.link,
                        id: t.id,
                        duration: t.duration,
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
     * Download Spotify track with multiple fallbacks
     */
    download: async (urlOrId) => {
        try {
            const trackId = getTrackId(urlOrId);
            
            // Method 1: spotisongdownloader.com
            try {
                console.log('[Spotify] Trying spotisongdownloader...');
                const { data } = await axios.get(
                    `https://api.spotisongdownloader.com/getTrack.php?url=https://open.spotify.com/track/${trackId}`,
                    { headers: CONFIG.HEADERS, timeout: 20000 }
                );
                
                if (data?.link) {
                    return {
                        status: true,
                        metadata: {
                            title: data.name || data.title || 'Unknown',
                            artist: data.artist || 'Unknown',
                            album: data.album || 'Unknown',
                            cover: data.image || data.cover || '',
                            duration: data.duration
                        },
                        download: {
                            mp3: data.link,
                            flac: null
                        }
                    };
                }
            } catch (e) {
                console.log('[Spotify] Method 1 failed');
            }
            
            // Method 2: spotifymate.com
            try {
                console.log('[Spotify] Trying spotifymate...');
                const { data } = await axios.post('https://api.spotifymate.com/getLinks', {
                    url: `https://open.spotify.com/track/${trackId}`
                }, { 
                    headers: { ...CONFIG.HEADERS, 'Content-Type': 'application/json' },
                    timeout: 20000 
                });
                
                if (data?.link) {
                    return {
                        status: true,
                        metadata: {
                            title: data.title || 'Unknown',
                            artist: data.artists || 'Unknown',
                            album: data.album || 'Unknown',
                            cover: data.cover || ''
                        },
                        download: {
                            mp3: data.link,
                            flac: null
                        }
                    };
                }
            } catch (e) {
                console.log('[Spotify] Method 2 failed');
            }
            
            // Method 3: spotifydown.com API
            try {
                console.log('[Spotify] Trying spotifydown...');
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
                            cover: spotifyDown.metadata?.cover || spotifyDown.cover || ''
                        },
                        download: {
                            mp3: spotifyDown.link,
                            flac: null
                        }
                    };
                }
            } catch (e) {
                console.log('[Spotify] Method 3 failed');
            }
            
            // Method 4: fabdl.com (original)
            try {
                console.log('[Spotify] Trying fabdl...');
                const getUrl = `https://api.fabdl.com/spotify/get?url=https://open.spotify.com/track/${trackId}`;
                const { data: trackData } = await axios.get(getUrl, { 
                    headers: CONFIG.HEADERS, 
                    timeout: 15000 
                });
                
                if (trackData.result) {
                    const { result } = trackData;
                    const gid = result.gid;
                    const taskId = result.id;
                    
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
                                cover: result.image || ''
                            },
                            download: {
                                mp3: `https://api.fabdl.com${convertData.result.download_url}`,
                                flac: null
                            }
                        };
                    }
                }
            } catch (e) {
                console.log('[Spotify] Method 4 failed');
            }
            
            return { status: false, msg: 'Semua metode download gagal. Coba lagi nanti.' };

        } catch (error) {
            console.error(`[Spotify Download] Error: ${error.message}`);
            return { status: false, msg: error.message };
        }
    }
};

module.exports = spotify;