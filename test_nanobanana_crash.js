
const puterImg2Img = require('./src/scraper/nanobanana');

async function test() {
    console.log('Testing puterImg2Img...');
    const buffer = Buffer.from('fakeimagebuffer');
    try {
        const result = await puterImg2Img(buffer, 'test prompt');
        console.log('Result:', result);
    } catch (e) {
        console.error('Caught error:', e);
    }
}

test();
