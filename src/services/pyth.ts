/**
 * Pyth Hermes API Service
 * Fetches real-time price data from Pyth Network
 */

// Mapping of common symbols to Pyth Price Feed IDs (Hermes API)
// Full list: https://pyth.network/developers/price-feed-ids
const PRICE_FEED_IDS: Record<string, string> = {
    'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    'SOL': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
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
    // Normalize IDs: ensure no 0x prefix for the URL query
    const ids = symbols
        .map(s => {
            const id = PRICE_FEED_IDS[s.toUpperCase()];
            return id ? id.replace('0x', '') : null;
        })
        .filter(Boolean) as string[];

    if (ids.length === 0) return {};

    try {
        const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${ids.sort().join('&ids[]=')}`;
        console.log(`[Pyth] Fetching: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[Pyth] API failure: ${response.status}`);
            return {};
        }

        const data = await response.json();
        const prices: Record<string, number> = {};

        if (!data.parsed) {
            console.warn('[Pyth] No parsed data from Hermes', data);
            return {};
        }

        // Hermes returns an array of price updates
        data.parsed.forEach((update: any) => {
            // Normalize both for comparison (remove 0x prefix if present)
            const feedId = update.id.replace('0x', '');
            const symbol = Object.keys(PRICE_FEED_IDS).find(s =>
                PRICE_FEED_IDS[s].replace('0x', '') === feedId
            );

            if (symbol) {
                const p = update.price;
                // Price is (price * 10^expo)
                const priceNum = parseFloat(p.price) * Math.pow(10, p.expo);
                prices[symbol] = priceNum;
                console.log(
                    `%c[Pyth] ${symbol}: $${priceNum.toLocaleString()}`,
                    'background: #10b981; color: white; font-weight: bold; padding: 2px 3px;'
                );
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
