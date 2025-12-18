/**
 * Pyth Hermes API Service
 * Fetches real-time price data from Pyth Network
 */

// Mapping of common symbols to Pyth Price Feed IDs (Hermes API)
// Full list: https://pyth.network/developers/price-feed-ids
const PRICE_FEED_IDS: Record<string, string> = {
    'BTC': '0xe62df6c8b4a27e162e37299c9085c18197112c888b6c6d3c03839f3393b1c55b',
    'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874592eca2d2',
    'SOL': '0xef0d8b6fda2ce37293426f65b2af33e291f7ee5af255cf31903503e4c14a00a8',
    'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f905273e65',
};

export interface PythPrice {
    price: number;
    conf: number;
    expo: number;
    publishTime: number;
}

/**
 * Fetches latest prices from Pyth Hermes API
 */
export async function getPythPrices(symbols: string[]): Promise<Record<string, number>> {
    const ids = symbols
        .map(s => PRICE_FEED_IDS[s.toUpperCase()])
        .filter(Boolean);

    if (ids.length === 0) return {};

    try {
        const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${ids.join('&ids[]=')}`);
        if (!response.ok) throw new Error('Pyth API failure');

        const data = await response.json();
        const prices: Record<string, number> = {};

        // Hermes returns an array of price updates
        data.parsed.forEach((update: any) => {
            const feedId = '0x' + update.id;
            const symbol = Object.keys(PRICE_FEED_IDS).find(s => PRICE_FEED_IDS[s] === feedId);
            if (symbol) {
                const p = update.price;
                // Price is (price * 10^expo)
                prices[symbol] = parseFloat(p.price) * Math.pow(10, p.expo);
            }
        });

        return prices;
    } catch (error) {
        console.error('Error fetching Pyth prices:', error);
        return {};
    }
}

/**
 * Fetches historical price data for sparklines (Mocking with mini-random walk around current price)
 * Pyth Hermes doesn't have a simple "history" endpoint for sparklines in a single call, 
 * so we fetch current and generate a realistic walk for the UI.
 */
export async function getPythSparkline(symbol: string): Promise<number[]> {
    const prices = await getPythPrices([symbol]);
    const current = prices[symbol.toUpperCase()];

    if (!current) return Array(20).fill(0).map(() => Math.random() * 100);

    // Generate a 20-point random walk ending at current price
    const points = [current];
    for (let i = 0; i < 19; i++) {
        const change = (Math.random() - 0.5) * (current * 0.02); // 2% max swing
        points.unshift(points[0] - change);
    }
    return points;
}
