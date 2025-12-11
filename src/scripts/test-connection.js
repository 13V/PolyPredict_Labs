const https = require('https');

const url = 'https://gamma-api.polymarket.com/events?active=true&limit=1';

console.log(`Testing connection to ${url}...`);

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    }
};

https.get(url, options, (res) => {
    console.log('Status Code:', res.statusCode);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('First 200 chars of response:');
        console.log(data.substring(0, 200));

        if (data.includes('Cisco') || data.includes('blocked')) {
            console.log('DIAGNOSIS: BLOCKED BY CISCO UMBRELLA');
        } else if (res.statusCode === 403) {
            console.log('DIAGNOSIS: BLOCKED BY CLOUDFLARE (Bot Protection)');
        } else if (res.statusCode === 200) {
            console.log('DIAGNOSIS: SUCCESS - Node.js can reach the API!');
        }
    });

}).on('error', (err) => {
    console.log('Error:', err.message);
});
