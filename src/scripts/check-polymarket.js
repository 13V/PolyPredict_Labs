process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkPolymarket() {
    try {
        console.log("Fetching data...");
        // Fetch top active events sorted by volume
        const url = 'https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume&ascending=false&limit=5';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log(`Response Status: ${response.status}`);

        if (!response.ok) {
            console.error(`Error: ${response.statusText}`);
            const text = await response.text();
            console.error("Response text:", text);
            return;
        }

        const data = await response.json();
        console.log(`Fetched ${data.length} events.`);

        if (data.length > 0) {
            const firstEvent = data[0];
            console.log('Sample Event Structure:');
            console.log(JSON.stringify(firstEvent, null, 2));
        }
    } catch (error) {
        console.error('Script Error:', error);
    }
}

checkPolymarket();
