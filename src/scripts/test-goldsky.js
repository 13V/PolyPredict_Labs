const fetch = require('node-fetch');

// URL found in search for Polymarket Goldsky
const GOLDSKY_URL = 'https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw/subgraphs/orderbook-subgraph/0.0.1/gn';

// Basic query to check connectivity
const query = `
{
  markets(first: 5) {
    id
    timestamp
  }
}
`;

async function testConnection() {
    console.log(`Connecting to ${GOLDSKY_URL}...`);
    try {
        const response = await fetch(GOLDSKY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        console.log('Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Success! Data received:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log('Failed:', await response.text());
        }
    } catch (error) {
        console.error('Connection Error:', error.message);
    }
}

testConnection();
