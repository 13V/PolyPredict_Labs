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

const MARKETS_KEY = 'polybet_user_markets';

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
 * Mark a user market as resolved in localStorage
 */
export function resolveUserMarket(id: number): void {
    const markets = getUserMarkets();
    const updated = markets.map(m => {
        if (m.id === id) {
            return { ...m, status: 'resolved' as const };
        }
        return m;
    });
    localStorage.setItem(MARKETS_KEY, JSON.stringify(updated));
}

/**
 * Clear user markets
 */
export function clearUserMarkets(): void {
    localStorage.removeItem(MARKETS_KEY);
}
