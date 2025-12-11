const fetch = require('node-fetch');

// Encode the Polymarket Gamma API URL
const targetUrl = encodeURIComponent('https://gamma-api.polymarket.com/events?active=true&limit=5');
const proxyUrl = `https://api.allorigins.win/get?url=${targetUrl}`;

async function testProxy() {
    console.log(`Connecting to proxy: ${proxyUrl}...`);
    try {
        const response = await fetch(proxyUrl);
        console.log('Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Proxy content received. Status code of contents:', data.status?.http_code);
            // The actual content is in data.contents (stringified JSON)
            if (data.contents) {
                console.log('Data Preview:', data.contents.substring(0, 100));
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testProxy();
