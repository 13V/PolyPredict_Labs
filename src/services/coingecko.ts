/**
 * CoinGecko API Service (Switched to Binance for better reliability/limits)
 * Fetches historical price data for sparklines and open prices
 */

const SYMBOL_TO_BINANCE: Record<string, string> = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'SOL': 'SOLUSDT',
};

/**
 * Fetches last 24h of price data from Binance (Public API)
 */
export async function getCoinGeckoSparkline(symbol: string): Promise<{ sparkline: number[]; openPrice: number | null }> {
    const pair = SYMBOL_TO_BINANCE[symbol.toUpperCase()];
    if (!pair) return { sparkline: [], openPrice: null };

    try {
        // Binance Public API: 1h intervals, 24 candles = 24h history
        const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1h&limit=24`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[Binance] API failure: ${response.status}`);
            return { sparkline: [], openPrice: null };
        }

        const data = await response.json();
        // Binance response format: [ [OpenTime, Open, High, Low, Close, Volume, ...], ... ]
        if (!Array.isArray(data) || data.length === 0) return { sparkline: [], openPrice: null };

        // Parse sparkline from Closing prices (index 4)
        const sparkline = data.map((candle: any[]) => parseFloat(candle[4]));

        // Open Price is the Opening price of the FIRST candle in the 24h series (index 1)
        // This gives us the "24h Open" or "Daily Open" equivalent relative to the chart
        const openPrice = parseFloat(data[0][1]);

        return { sparkline, openPrice };
    } catch (error) {
        console.error('Error fetching Binance market data:', error);
        return { sparkline: [], openPrice: null };
    }
}
