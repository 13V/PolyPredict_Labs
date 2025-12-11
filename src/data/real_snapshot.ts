export const realSnapshot = [
    // --- FEATURED / HOT ---
    {
        id: 101,
        question: "Will Bitcoin close higher daily?",
        category: "CRYPTO",
        timeLeft: "4h left",
        yesVotes: 350000,
        noVotes: 650000,
        totalVolume: 89000000,
        isHot: true
    },
    {
        id: 102,
        question: "Daily: ETH above $3800 at midnight?",
        category: "CRYPTO",
        timeLeft: "6h left",
        yesVotes: 9300,
        noVotes: 700,
        totalVolume: 45000000,
        isHot: true
    },
    {
        id: 103,
        question: "NBA: Lakers vs Warriors (Tonight)",
        category: "SPORTS",
        timeLeft: "8h left",
        yesVotes: 39000,
        noVotes: 61000,
        totalVolume: 24000000,
        outcomeLabels: ["Lakers", "Warriors"],
        isHot: true,
        status: "resolving", // Demo the verification UI
        timeLeft: "Ended"
    },
    {
        id: 104,
        question: "Daily: SOL to flip BNB today?",
        category: "CRYPTO",
        timeLeft: "12h left",
        yesVotes: 18000,
        noVotes: 82000,
        totalVolume: 12000000,
        isHot: true
    },

    // --- CRYPTO ---
    { id: 201, question: "Will Bitcoin stay above $98k today?", category: "CRYPTO", timeLeft: "8h", yesVotes: 950, noVotes: 9050, totalVolume: 2800000 },
    { id: 202, question: "Daily: DOGE to hit $0.45?", category: "CRYPTO", timeLeft: "5h", yesVotes: 9900, noVotes: 100, totalVolume: 5000000 },
    { id: 203, question: "Hourly: ETH > $3900?", category: "CRYPTO", timeLeft: "45m", yesVotes: 8300, noVotes: 1700, totalVolume: 1200000 },

    // --- SPORTS (Tonight's Games) ---
    { id: 401, question: "NBA: Celtics vs Heat Winner", category: "SPORTS", timeLeft: "4h", yesVotes: 5200, noVotes: 4800, totalVolume: 2100000, outcomeLabels: ["Celtics", "Heat"] },
    { id: 402, question: "Premier League: Man City vs Arsenal", category: "SPORTS", timeLeft: "2h", yesVotes: 4500, noVotes: 5500, totalVolume: 8500000, outcomeLabels: ["Man City", "Arsenal"] },
    { id: 403, question: "UFC Fight Night: Main Event Winner", category: "SPORTS", timeLeft: "9h", yesVotes: 6200, noVotes: 3800, totalVolume: 900000, outcomeLabels: ["Fighter A", "Fighter B"] },

    // --- POP / NEWS (Short term) ---
    { id: 501, question: "Daily: MrBeast Video > 10M views in 1h?", category: "POP", timeLeft: "50m", yesVotes: 3300, noVotes: 6700, totalVolume: 1500000 },
    { id: 301, question: "Daily: Trump to post on Truth Social today?", category: "POLITICS", timeLeft: "14h", yesVotes: 8800, noVotes: 1200, totalVolume: 3200000 },

    // --- EXPANDED SNAPSHOT (To guarantee 25+ items) ---
    { id: 601, question: "Will GTA 6 Trailer 2 drop this week?", category: "POP", timeLeft: "3d", yesVotes: 15000, noVotes: 85000, totalVolume: 4200000 },
    { id: 602, question: "Daily: TSLA to close above $250?", category: "CRYPTO", timeLeft: "3h", yesVotes: 45000, noVotes: 55000, totalVolume: 12500000 },
    { id: 603, question: "Champions League: Real Mardid vs Bayern", category: "SPORTS", timeLeft: "5h", yesVotes: 62000, noVotes: 38000, totalVolume: 24000000, outcomeLabels: ["Real", "Bayern"] },
    { id: 604, question: "Will Fed cut rates in next meeting?", category: "POLITICS", timeLeft: "12d", yesVotes: 25000, noVotes: 75000, totalVolume: 8900000 },
    { id: 605, question: "Daily: PEPE to flip SHIB market cap?", category: "CRYPTO", timeLeft: "11h", yesVotes: 12000, noVotes: 88000, totalVolume: 3500000 },
    { id: 606, question: "Will Taylor Swift announce new tour date?", category: "POP", timeLeft: "2d", yesVotes: 30000, noVotes: 70000, totalVolume: 5600000 },
    { id: 607, question: "Daily: SPX to hit new ATH today?", category: "CRYPTO", timeLeft: "5h", yesVotes: 22000, noVotes: 78000, totalVolume: 18000000 },
    { id: 608, question: "UFC 300: Pereira vs Hill", category: "SPORTS", timeLeft: "1d", yesVotes: 55000, noVotes: 45000, totalVolume: 15000000, outcomeLabels: ["Pereira", "Hill"] },
    { id: 609, question: "Will Kai Cenat verify his stream?", category: "POP", timeLeft: "6h", yesVotes: 85000, noVotes: 15000, totalVolume: 1200000 },
    { id: 610, question: "Daily: WIF to hit $3.00?", category: "CRYPTO", timeLeft: "8h", yesVotes: 42000, noVotes: 58000, totalVolume: 6700000 },
    { id: 611, question: "Will Drake drop a diss track today?", category: "POP", timeLeft: "18h", yesVotes: 15000, noVotes: 85000, totalVolume: 3400000 },
    { id: 612, question: "F1: Verstappen to win next GP?", category: "SPORTS", timeLeft: "4d", yesVotes: 85000, noVotes: 15000, totalVolume: 9500000, outcomeLabels: ["Yes", "No"] },
    { id: 613, question: "Will OpenAI release GPT-5 this month?", category: "CRYPTO", timeLeft: "20d", yesVotes: 10000, noVotes: 90000, totalVolume: 12000000 },
    { id: 614, question: "Daily: NVDA to hit $1000?", category: "CRYPTO", timeLeft: "4h", yesVotes: 38000, noVotes: 62000, totalVolume: 22000000 },
    { id: 615, question: "Will Kanye West tweet today?", category: "POP", timeLeft: "12h", yesVotes: 25000, noVotes: 75000, totalVolume: 4500000 },
    { id: 616, question: "NFL: Chiefs to win Super Bowl?", category: "SPORTS", timeLeft: "200d", yesVotes: 45000, noVotes: 55000, totalVolume: 65000000, outcomeLabels: ["Chiefs", "Field"] },
    { id: 617, question: "Daily: COIN stock > $250?", category: "CRYPTO", timeLeft: "3h", yesVotes: 52000, noVotes: 48000, totalVolume: 8200000 },
    { id: 618, question: "Will TikTok be banned in US this year?", category: "POLITICS", timeLeft: "150d", yesVotes: 65000, noVotes: 35000, totalVolume: 45000000 },
    { id: 619, question: "Daily: MSTR to buy more Bitcoin?", category: "CRYPTO", timeLeft: "14h", yesVotes: 92000, noVotes: 8000, totalVolume: 5600000 },
    { id: 620, question: "Boxing: Jake Paul vs Tyson Winner", category: "SPORTS", timeLeft: "30d", yesVotes: 40000, noVotes: 60000, totalVolume: 85000000, outcomeLabels: ["Paul", "Tyson"] },
];
