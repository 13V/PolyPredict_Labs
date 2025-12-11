export const generateSyntheticMarkets = () => {
    const categories = ['CRYPTO', 'POLITICS', 'SPORTS', 'NEWS'];
    const markets = [];

    // 1. High Profile / Manual Hits (The "Real" looking ones)
    const featured = [
        { q: "Will Bitcoin hit $100k in 2024?", c: "CRYPTO", y: 65, vol: 4500000 },
        { q: "Will Donald Trump win the 2024 Election?", c: "POLITICS", y: 52, vol: 12000000 },
        { q: "Will Ethereum flip Bitcoin market cap in 2025?", c: "CRYPTO", y: 15, vol: 890000 },
        { q: "Kansas City Chiefs to win Super Bowl LIX?", c: "SPORTS", y: 18, vol: 2100000 },
        { q: "Will the Fed cut interest rates in Q1 2025?", c: "NEWS", y: 72, vol: 1500000 },
        { q: "Solana to hit $200 before December?", c: "CRYPTO", y: 45, vol: 3200000 },
        { q: "Will France win Euro 2024?", c: "SPORTS", y: 22, vol: 450000 },
        { q: "Who will be the next US President?", c: "POLITICS", y: 48, vol: 5600000 },
    ];

    featured.forEach((item, i) => {
        markets.push({
            id: 1000 + i,
            question: item.q,
            category: item.c,
            timeLeft: Math.random() > 0.5 ? 'Today' : '2d',
            yesVotes: Math.floor(item.y * 100),
            noVotes: Math.floor((100 - item.y) * 100), // simplistic counts
            totalVolume: item.vol,
            isHot: true
        });
    });

    // 2. Procedural Fillers (To reach 100)
    const cryptoAssets = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'DOT'];
    const politicalEvents = ['approval rating', 'debate winner', 'bill passing', 'resignation'];
    const sportsTeams = ['Lakers', 'Warriors', 'Yankees', 'Cowboys', 'Real Madrid', 'Man City'];

    for (let i = 0; i < 90; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        let q = "";
        let vol = Math.floor(Math.random() * 500000) + 10000;

        if (cat === 'CRYPTO') {
            const asset = cryptoAssets[Math.floor(Math.random() * cryptoAssets.length)];
            const price = Math.floor(Math.random() * 5000);
            q = `Will ${asset} stay above $${price} this week?`;
        } else if (cat === 'POLITICS') {
            const event = politicalEvents[Math.floor(Math.random() * politicalEvents.length)];
            q = `Will Biden's ${event} drop below 40%?`;
        } else if (cat === 'SPORTS') {
            const team = sportsTeams[Math.floor(Math.random() * sportsTeams.length)];
            q = `Will ${team} win their next match?`;
        } else {
            q = `Will Event #${i + 20} happen by Friday?`;
        }

        const yesPct = Math.floor(Math.random() * 90) + 5;

        markets.push({
            id: 2000 + i,
            question: q,
            category: cat,
            timeLeft: Math.floor(Math.random() * 5) + 'd',
            yesVotes: yesPct * 50,
            noVotes: (100 - yesPct) * 50,
            totalVolume: vol,
            isHot: vol > 200000
        });
    }

    return markets.sort((a, b) => b.totalVolume - a.totalVolume);
};
