import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const closed = searchParams.get('closed') || 'false';
    const id = searchParams.get('id');
    const ids = searchParams.get('ids'); // Support batch fetching

    try {
        // Direct call to Polymarket (Server-side, no CORS proxy needed)
        let targetUrl = `https://gamma-api.polymarket.com/events?closed=${closed}&order=liquidity&ascending=false&limit=${limit}&offset=${offset}`;

        if (id) {
            // Single ID
            targetUrl = `https://gamma-api.polymarket.com/events?id=${id}`;
        } else if (ids) {
            // Batch IDs (comma separated) -> convert to ?id=1&id=2...
            const idList = ids.split(',');
            const query = idList.map(i => `id=${i.trim()}`).join('&');
            targetUrl = `https://gamma-api.polymarket.com/events?${query}`;
        }

        console.log(`[API] Fetching: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            cache: 'no-store' // Ensure fresh data on Edge
        });

        if (!response.ok) {
            throw new Error(`Polymarket API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[API] Error fetching markets:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
