/**
 * CoinGecko API Service
 * Fetches historical price data for sparklines
 */

const SYMBOL_TO_ID: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
};

/**
 * Fetches last 24h of price data from CoinGecko
 */
export async function getCoinGeckoSparkline(symbol: string): Promise<number[]> {
    const id = SYMBOL_TO_ID[symbol.toUpperCase()];
    if (!id) return [];

    try {
        // Public API (Demo) limits: 30 calls/minute
        const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1&interval=hourly`;
        console.log(`[CoinGecko] Fetching: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[CoinGecko] API failure: ${response.status}`);
            return [];
        }

        const data = await response.json();
        // data.prices is an array of [timestamp, price]
        if (!data.prices || !Array.isArray(data.prices)) return [];

        return data.prices.map((p: [number, number]) => p[1]);
    } catch (error) {
        console.error('Error fetching CoinGecko sparkline:', error);
        return [];
    }
}
