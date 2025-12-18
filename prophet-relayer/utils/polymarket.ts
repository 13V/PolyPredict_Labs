import axios from "axios";

export interface PolymarketResult {
    isResolved: boolean;
    winningOutcomeIndex?: number;
}

/**
 * Fetches the result of a Polymarket market by its ID.
 * Polymarket ID is typically a hash or a slug.
 */
export async function fetchPolymarketResult(polymarketId: string): Promise<PolymarketResult> {
    try {
        // Note: Polymarket CLOB API endpoint to fetch market details
        // For many markets, the slug or ID can be checked via the Gamma API or CLOB API.
        // Example using Gamma API which is common for UI data:
        const response = await axios.get(`https://gamma-api.polymarket.com/markets?id=${polymarketId}`);

        if (response.data && response.data.length > 0) {
            const market = response.data[0];

            // Check if market is closed/resolved
            if (market.closed && market.active === false) {
                // In Polymarket, 'outcomePrices' usually drop to 0 or 1 for the winner.
                // We'll use the 'resolved' field if available or check historical results.
                // For this implementation, we assume the API returns clear resolution data.

                // Polymarket Gamma API typically provides 'winningOutcomeIndex'
                if (market.hasOwnProperty('winningOutcomeIndex')) {
                    return {
                        isResolved: true,
                        winningOutcomeIndex: market.winningOutcomeIndex
                    };
                }
            }
        }

        return { isResolved: false };
    } catch (error) {
        console.error(`Error fetching Polymarket data for ${polymarketId}:`, error);
        return { isResolved: false };
    }
}
