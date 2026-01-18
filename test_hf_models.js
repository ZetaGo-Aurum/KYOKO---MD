const nanobanana = require('./src/scraper/nanobanana');

async function testAllModels() {
    console.log('=== Testing Hugging Face Integration ===\n');
    
    // Test SDXL (Universal)
    console.log('1. Testing SDXL (Universal)...');
    const sdxl = await nanobanana.generateUniversal('A beautiful sunset over mountains');
    console.log('   Result:', sdxl.success ? 'SUCCESS ✓' : `FAILED: ${sdxl.error}`);
    
    // Test Anime
    console.log('\n2. Testing Anything V5 (Anime)...');
    const anime = await nanobanana.generateAnime('cute anime girl with blue hair');
    console.log('   Result:', anime.success ? 'SUCCESS ✓' : `FAILED: ${anime.error}`);
    
    // Test legacy function
    console.log('\n3. Testing Legacy puterImg2Img compatibility...');
    const legacy = await nanobanana(Buffer.from('test'), 'A cat sitting on a chair');
    console.log('   Result:', legacy.success ? 'SUCCESS ✓' : `FAILED: ${legacy.error}`);
    
    console.log('\n=== Test Complete ===');
    console.log('Available Models:', nanobanana.getAvailableModels());
}

testAllModels().catch(console.error);
