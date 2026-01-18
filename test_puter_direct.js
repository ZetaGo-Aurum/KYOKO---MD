const axios = require('axios');
require('dotenv').config();

async function testDirect() {
    const token = process.env.puterAuthToken;
    if (!token) {
        console.error('No token in .env');
        return;
    }

    console.log(`Testing with token: ${token.substring(0, 15)}...`);

    const payload = {
        interface: 'puter-image-generation',
        driver: 'ai-image',
        method: 'generate',
        args: {
            prompt: 'A cyberpunk city',
            model: 'gemini-2.5-flash-latest'
        },
        auth_token: token,
        test_mode: false
    };

    try {
        console.log('Sending request to https://api.puter.com/drivers/call...');
        const res = await axios.post('https://api.puter.com/drivers/call', payload, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': `Bearer ${token}`,
                'Origin': 'https://puter.com',
                'Referer': 'https://puter.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));

        if (res.data.success) {
            console.log('SUCCESS! Direct API works.');
        } else {
            console.error('FAILED (Logic):', res.data);
        }

    } catch (err) {
        console.error('FAILED (Network/Auth):', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', err.response.data);
        }
    }
}

testDirect();
