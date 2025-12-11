import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    // Disable SSL verification for local dev (bypasses Cisco Umbrella MITM)
    if (process.env.NODE_ENV === 'development') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    try {
        const url = `https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume&ascending=false&limit=${limit}&offset=${offset}`;

        console.log(`[Proxy] Fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://polymarket.com/',
                'Origin': 'https://polymarket.com'
            }
        });

        if (!response.ok) {
            console.error(`[Proxy] Upstream Error: ${response.status}`);
            return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('[Proxy] Failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
