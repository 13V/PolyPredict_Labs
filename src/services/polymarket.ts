import { dailyPredictions } from '@/data/predictions';

export interface PolymarketEvent {
    id: string;
    title: string;
    slug: string;
    markets: Array<{
        id: string;
        question: string;
        outcomes: string[]; // ["Yes", "No"]
        outcomePrices: string[]; // ["0.65", "0.35"]
        volume: string;
        liquidity: string;
        endDate: string;
        description?: string;
    }>;
    volume: string;
    image?: string;
    description?: string;
}

// Use internal API to bypass CORS
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchPolymarketTrending(limit = 50, offset = 0, sortBy = 'liquidity', ascending = false, tag?: string) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            // STRATEGY: Client-Side Fetch via Public CORS Proxy
            let gammaUrl = `https://gamma-api.polymarket.com/events?active=true&closed=false&order=${sortBy}&ascending=${ascending}&limit=${limit}&offset=${offset}`;
            if (tag) {
                gammaUrl += `&tag_slug=${tag}`;
            }

            let response;
            let usedSource = 'Client-Proxy';

            try {
                // Priority 1: Client Proxy
                console.log('Fetching via corsproxy.io...');
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(gammaUrl)}`;
                response = await fetch(proxyUrl);
                if (!response.ok) throw new Error('Proxy 1 failed');
            } catch (proxyError) {
                console.warn('Proxy 1 failed, attempting fallback...', proxyError);

                // Priority 2: Alternative Proxy
                try {
                    usedSource = 'allorigins';
                    const proxyUrl2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(gammaUrl)}`;
                    response = await fetch(proxyUrl2);
                    if (!response.ok) throw new Error('Proxy 2 failed');
                } catch (internalError) {
                    // Priority 3: Internal API (Likely blocked, but worth a shot)
                    usedSource = 'Internal-API';
                    console.log('Fallback to Internal API...');
                    const internalUrl = `/api/markets?limit=${limit}&offset=${offset}`; // Tags not supported on simple fallback
                    response = await fetch(internalUrl);
                }
            }

            if (!response || !response.ok) {
                throw new Error(`All Fetch Methods Failed. Last status: ${response ? response.status : 'Network Error'}`);
            }

            const events: PolymarketEvent[] = await response.json();
            console.log(`[Polymarket] Received ${events.length} raw events from ${usedSource}`);

            // Map to our internal format
            return events.map(event => {
                const market = event.markets[0]; // Take the first/primary market
                if (!market) return null;

                // Parse prices (Robust handling for API variations)
                let prices = market.outcomePrices;

                // If it's a string (JSON stringified), parse it first
                if (typeof prices === 'string') {
                    try {
                        prices = JSON.parse(prices);
                    } catch (e) {
                        console.warn('Failed to parse outcomePrices', prices);
                        prices = ["0.5", "0.5"];
                    }
                }

                const yesPrice = (prices && prices[0]) ? parseFloat(prices[0]) : 0.5;
                const noPrice = (prices && prices[1]) ? parseFloat(prices[1]) : 0.5;

                // Calculate votes from volume (rough approximation: $1 = 1 vote)
                const totalVolume = parseFloat(market.volume || event.volume || '0');
                const yesVotes = Math.floor(totalVolume * yesPrice);
                const noVotes = Math.floor(totalVolume * noPrice);

                // Parse outcomes (Robust handling)
                let outcomes = market.outcomes;
                if (typeof outcomes === 'string') {
                    try {
                        outcomes = JSON.parse(outcomes);
                    } catch (e) {
                        console.warn('Failed to parse outcomes', outcomes);
                        outcomes = ["YES", "NO"];
                    }
                }

                // Ensure it's an array
                if (!Array.isArray(outcomes) || outcomes.length === 0) {
                    outcomes = ["YES", "NO"];
                }

                // Heuristic: Smart Labeling for Sports/Esports
                // Problem: Polymarket often returns "Yes/No" for "Will Team A win?"
                // Solution: Extract Team/Player names from the question for better UX.
                const isBinary = outcomes.length === 2 &&
                    (['yes', 'no', 'over', 'under', 'win', 'lose'].includes(outcomes[0].toLowerCase()) ||
                        ['yes', 'no', 'over', 'under', 'win', 'lose'].includes(outcomes[1].toLowerCase()));

                if (isBinary) {
                    const titleV = event.title || event.slug || "";

                    // Case A: "Team A vs Team B" (Standard)
                    if (titleV.includes(" vs ") || titleV.includes(" vs. ")) {
                        const parts = titleV.split(/ vs\.? /i);
                        if (parts.length === 2) {
                            // Remove "Will " prefix and " win?" suffix if present to get clean team names
                            const teamA = parts[0].replace(/^Will\s+/i, '').replace(/\s+win\??$/i, '').trim();
                            const teamB = parts[1].replace(/\s+win\??$/i, '').replace(/\?$/, '').trim();

                            if (teamA.length < 30 && teamB.length < 30) {
                                outcomes = [teamA, teamB];
                            }
                        }
                    }
                    // Case B: "Will Team A beat Team B?"
                    else if (titleV.match(/Will (.+) beat (.+)\?/i)) {
                        const match = titleV.match(/Will (.+) beat (.+)\?/i);
                        if (match && match.length === 3) {
                            outcomes = [match[1].trim(), match[2].trim()];
                        }
                    }
                }

                // --- STRICT QUALITY FILTER ---
                // 1. Binary Markets Only: Multi-outcome markets (e.g. 10 horses) display poorly as binary.
                if (outcomes.length !== 2) return null;

                // 2. Dead Market Filter: If odds are 0% or 100%, it's likely resolved or dead. Boring for active betting.
                // We want playable markets.
                if (yesPrice <= 0.01 || yesPrice >= 0.99) return null;

                return {
                    id: parseInt(market.id) || parseInt(event.id) || Math.random() * 100000,
                    question: market.question || event.title,
                    category: classifyCategory(event.slug),
                    endTime: Math.floor(new Date(market.endDate).getTime() / 1000),
                    outcomes: outcomes,
                    totals: [yesVotes, noVotes, ...new Array(outcomes.length - 2).fill(0)], // Mocking totals for multi-outcome demo
                    totalLiquidity: totalVolume,
                    resolved: false,
                    isHot: totalVolume > 100000,
                    polymarketId: market.id,
                    slug: event.slug,
                    eventTitle: event.title,
                    description: market.description || event.description || ""
                };
            }).filter(item => item !== null);

        } catch (error: any) {
            console.warn(`Polymarket fetch attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
            attempt++;

            if (attempt >= maxRetries) {
                console.error('All Polymarket fetch attempts failed.');
                return []; // Return empty array (no fake data)
            }

            // Backoff: 1s, 2s, 4s...
            await delay(1000 * Math.pow(2, attempt - 1));
        }
    }
    return [];
}

/**
 * Lightweight batch refresher for live odds
 */
export async function refreshMarketBatch(ids: number[]): Promise<any[]> {
    if (ids.length === 0) return [];

    // Chunk into batches of 20 to avoid URL length limits
    const chunks = [];
    const chunkSize = 20;
    for (let i = 0; i < ids.length; i += chunkSize) {
        chunks.push(ids.slice(i, i + chunkSize));
    }

    let allEvents: PolymarketEvent[] = [];

    for (const chunk of chunks) {
        try {
            const query = chunk.join(',');
            const response = await fetch(`/api/markets?ids=${query}`);
            if (response.ok) {
                const events: PolymarketEvent[] = await response.json();
                allEvents = [...allEvents, ...events];
            }
        } catch (e) {
            console.error("Batch refresh failed:", e);
        }
    }

    // Map using the same logic (We can refactor the mapper out, but for now duplicate the core logic for safety)
    return allEvents.map(event => {
        const market = event.markets[0];
        if (!market) return null;

        let prices = market.outcomePrices;
        if (typeof prices === 'string') {
            try { prices = JSON.parse(prices); } catch { prices = ["0.5", "0.5"]; }
        }
        const yesPrice = (prices && prices[0]) ? parseFloat(prices[0]) : 0.5;
        const noPrice = (prices && prices[1]) ? parseFloat(prices[1]) : 0.5;
        const totalVolume = parseFloat(market.volume || event.volume || '0');

        // Return only what's needed for update
        const id = parseInt(market.id);
        const yesVotes = Math.floor(totalVolume * yesPrice);
        const noVotes = Math.floor(totalVolume * noPrice);

        return {
            id,
            totals: [yesVotes, noVotes],
            totalLiquidity: totalVolume,
            outcomes: market.outcomes // Just in case
        };
    }).filter(item => item !== null);
}

function classifyCategory(slug: string): 'CRYPTO' | 'POLITICS' | 'SPORTS' | 'NEWS' | 'ESPORTS' {
    const s = slug.toLowerCase();

    // 0. Esports (Specific games & terms)
    if (s.includes('valorant') || s.includes('lol') || s.includes('league') || s.includes('counter-strike') || s.includes('csgo') || s.includes('dota') || s.includes('esports') || s.includes('iem') || s.includes('blast') || s.includes('pgl') || s.includes('vct') || s.includes('major') || s.includes('pro league')) return 'ESPORTS';

    // 1. Politics (Highest Priority - Specific Names & Terms)
    if (s.includes('trump') || s.includes('biden') || s.includes('harris') || s.includes('election') || s.includes('republican') || s.includes('democrat') || s.includes('senate') || s.includes('house') || s.includes('president') || s.includes('nominee') || s.includes('cabinet') || s.includes('confirm') || s.includes('vote') || s.includes('policy') || s.includes('poll') || s.includes('approval') || s.includes('regulation') || s.includes('law') || s.includes('court') || s.includes('supreme') || s.includes('congress') || s.includes('parliament') || s.includes('minister') || s.includes('war') || s.includes('israel') || s.includes('ukraine') || s.includes('china') || s.includes('nato') || s.includes('un ') || s.includes('musk') || s.includes('rfk') || s.includes('vivek')) return 'POLITICS';

    // 2. Sports (Clubs, Leagues, Action words)
    if (s.includes('nfl') || s.includes('nba') || s.includes('soccer') || s.includes('league') || s.includes('cup') || s.includes('sport') || s.includes('fight') || s.includes('boxing') || s.includes('ufc') || s.includes('mma') || s.includes('formula') || s.includes('f1') || s.includes('champion') || s.includes('winner') || s.includes('score') || s.includes('vs') || s.includes('fc ') || s.includes('united') || s.includes('real madrid') || s.includes('barcelona') || s.includes('liverpool') || s.includes('city') || s.includes('chelsea') || s.includes('arsenal') || s.includes('goal') || s.includes('points') || s.includes('touchdown') || s.includes('over/under') || s.includes('handicap')) return 'SPORTS';

    // 3. Crypto (Coins, Tokens, Finance)
    if (s.includes('bitcoin') || s.includes('ethereum') || s.includes('solana') || s.includes('crypto') || s.includes('token') || s.includes('price') || s.includes('coin') || s.includes('market') || s.includes('etf') || s.includes('btc') || s.includes('eth') || s.includes('sol') || s.includes('memecoin') || s.includes('pepe') || s.includes('doge') || s.includes('bonk') || s.includes('wif') || s.includes('fed ') || s.includes('rates') || s.includes('inflation')) return 'CRYPTO';

    return 'NEWS'; // Default fallback
}

function formatDate(dateStr: string) {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'Today';
        return `${diffDays}d`;
    } catch {
        return 'Soon';
    }
}

// Check specific market for resolution
export async function fetchMarketResult(id: number): Promise<'yes' | 'no' | null> {
    try {
        // Only valid for real Polymarket IDs
        if (id < 10000) return null; // Skip snapshot/fake IDs

        const targetUrl = `/api/markets?id=${id}`;
        // Note: The API route needs to support single ID fetching or filtering. 
        // Current API route just passes query params, so this goes to Polymarket as &id=...
        // Polymarket Gamma API usually filters by ID if provided.

        const response = await fetch(targetUrl);
        if (!response.ok) return null;

        const events: PolymarketEvent[] = await response.json();
        const event = events.find(e => e.markets.some(m => m.id === id.toString()));

        if (!event) return null;

        const market = event.markets.find(m => m.id === id.toString());
        if (!market) return null;

        // Heuristic: Check prices if market is expired
        const now = new Date();
        const endDate = new Date(market.endDate);

        // If it's been over 2 hours since end date, check for price convergence
        if (now > endDate) {
            const yesPrice = parseFloat(market.outcomePrices[0]);
            const noPrice = parseFloat(market.outcomePrices[1]);

            if (yesPrice > 0.95) return 'yes';
            if (noPrice > 0.95) return 'no';
        }

        return null;

    } catch (e) {
        console.error("Oracle check failed:", e);
        return null;
    }
}

/**
 * Smart Fetcher: hunts for markets ending < 24h.
 * FALLBACK: If not enough daily markets are found, it fills the rest with standard trending markets.
 */
export async function fetchDailyMarkets(requiredCount = 50): Promise<any[]> {
    let collected: any[] = [];

    // 1. MAIN DEEP SCAN (Find highest volume ending soon)
    const deepScanLimit = 30; // Pages to scan for general high volume
    let offset = 0;
    const batchSize = 100;

    console.log(`Phase 1: Deep Scan...`);
    try {
        for (let i = 0; i < deepScanLimit; i++) {
            const batch = await fetchPolymarketTrending(batchSize, offset, 'endDate', true);
            if (batch.length === 0) break;

            const valid = batch.filter(m => {
                if (m.totalLiquidity < 1000) return false;
                if (!m.endTime) return false;
                const hoursLeft = (m.endTime * 1000 - Date.now()) / (1000 * 60 * 60);
                return hoursLeft > 0 && hoursLeft <= 24;
            });

            for (const item of valid) {
                if (!collected.find(c => c.id === item.id)) collected.push(item);
            }
            offset += batchSize;
            if (collected.length >= 40) break; // Don't overfill yet
            await delay(100);
        }
    } catch (e) { console.warn("Deep scan error:", e); }

    // 2. CATEGORY QUOTA CHECK & FILL
    // We want at least 5 for filtered buckets: POLITICS, SPORTS, CRYPTO
    const categories: ('POLITICS' | 'SPORTS' | 'CRYPTO')[] = ['POLITICS', 'SPORTS', 'CRYPTO'];
    const buckets: Record<string, number> = { POLITICS: 0, SPORTS: 0, CRYPTO: 0 };
    collected.forEach(m => { if (buckets[m.category] !== undefined) buckets[m.category]++; });

    console.log("Category Counts before fill:", buckets);

    for (const cat of categories) {
        if (buckets[cat] < 6) { // User wants 5, we fetch 6 to be safe
            console.log(`Refilling ${cat} (Current: ${buckets[cat]})...`);
            try {
                // Targeted fetch by tag
                const tag = cat.toLowerCase(); // 'politics', 'sports', 'crypto' work as tags
                // We fetch 'volume' sorted to get best items
                // Note: We might NOT filter strictly by 24h here if it's too empty, 
                // but let's try to stick to quality. 
                const fillBatch = await fetchPolymarketTrending(100, 0, 'volume', false, tag);

                let added = 0;
                for (const item of fillBatch) {
                    if (item.totalLiquidity < 100) continue; // Basic quality

                    // DATE FILTER for Refill:
                    // Prevent long-term markets (e.g. 2026) from filling the quota just because they have volume.
                    if (!item.endTime) continue;
                    const hoursLeft = (item.endTime * 1000 - Date.now()) / (1000 * 60 * 60);
                    if (hoursLeft > 48 || hoursLeft <= 0) continue;

                    // Force Category Match logic to be consistent
                    item.category = cat;

                    if (!collected.find(c => c.id === item.id)) {
                        collected.push(item);
                        added++;
                        if (buckets[cat] + added >= 6) break;
                    }
                }
            } catch (e) {
                console.warn(`Failed refilling ${cat}:`, e);
            }
        }
    }

    // Sort by volume descending
    return collected.sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 60);
}
