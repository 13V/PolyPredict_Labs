export interface Market {
    id: number;
    category: string;
    question: string;
    timeLeft: string;
    endDate: string;
    yesVotes: number;
    noVotes: number;
    totalVolume: number;
    isHot?: boolean;
    outcomeLabels?: string[];
    status?: 'active' | 'resolving' | 'resolved';
    pumpFunMint?: string; // CA of the token required to bet
}

const MARKETS_KEY = 'prophet_user_markets';

/**
 * Save a new user-created market
 */
export function saveUserMarket(market: Market): void {
    const markets = getUserMarkets();
    markets.push(market);
    localStorage.setItem(MARKETS_KEY, JSON.stringify(markets));
}

/**
 * Get all user-created markets
 */
export function getUserMarkets(): Market[] {
    if (typeof window === 'undefined') return [];

    const json = localStorage.getItem(MARKETS_KEY);
    if (!json) return [];

    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
}

/**
 * Clear user markets
 */
export function clearUserMarkets(): void {
    localStorage.removeItem(MARKETS_KEY);
}
