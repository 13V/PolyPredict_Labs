'use client';
import { WalletConnect } from "@/components/WalletConnect";
import { PredictionCard } from "@/components/PredictionCard";
import { useState, useEffect } from 'react';
import { TrustBadges } from "@/components/TrustBadges";
import { ActivityTicker } from "@/components/ActivityTicker";
import { FeaturedMarket } from "@/components/FeaturedMarket";
import { NavCategories } from "@/components/NavCategories";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Twitter, Send, Copy, Check, Plus, Search } from "lucide-react";
import { CreateMarketModal } from '@/components/CreateMarketModal';
import { UserPositions } from '@/components/UserPositions';
import { MobileNav } from '@/components/MobileNav';
import { HowItWorks } from "@/components/HowItWorks";
import { Background } from "@/components/Background";
import { MarketWarRoom } from "@/components/MarketWarRoom";
import { TraderDashboard } from "@/components/TraderDashboard";
import { useWallet } from '@solana/wallet-adapter-react';

import { fetchPolymarketTrending, fetchMarketResult } from '@/services/polymarket';
import { generateSyntheticMarkets } from '@/data/synthetic';
import { realSnapshot } from '@/data/real_snapshot';
import { getUserMarkets, resolveUserMarket } from '@/utils/marketStorage';
import { saveResolution, getResolutionStatus } from '@/utils/voteStorage';

const CONTRACT_ADDRESS = 'COMING SOON';

export default function Home() {
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'volume' | 'newest' | 'ending'>('volume');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPositionsOpen, setIsPositionsOpen] = useState(false);
  const [fetchError, setFetchError] = useState<boolean | string>(false);

  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  const [isWarRoomOpen, setIsWarRoomOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const openWarRoom = (market: any) => {
    setSelectedMarket(market);
    setIsWarRoomOpen(true);
  };

  const handleSettle = async (id: number) => {
    const market = predictions.find(p => p.id === id);
    if (!market) return;

    let winningOutcome = 0; // Default to YES/Index 0 if unknown

    // 1. Try to fetch real oracle result if it's a Polymarket item
    if (market.polymarketId) {
      try {
        const result = await fetchMarketResult(id);
        if (result === 'no') winningOutcome = 1;
        else if (result === 'yes') winningOutcome = 0;

        // Persist Polymarket resolution
        saveResolution(id, result || 'yes');
      } catch (e) {
        console.error("Failed to auto-resolve polymarket:", e);
      }
    } else {
      // 2. Persist User-created market resolution
      resolveUserMarket(id);
    }

    setPredictions(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, resolved: true, winningOutcome };
      }
      return p;
    }));
  };

  useEffect(() => {
    async function loadBackgroundData() {
      try {
        console.log("Fetching live data...");
        setIsLoading(true);

        const { fetchDailyMarkets } = await import('@/services/polymarket');
        const dailyMarkets = await fetchDailyMarkets(50);

        // Fetch Global On-Chain Markets
        const { getProgram } = await import('@/services/web3');
        let onChainMarkets: any[] = [];

        try {
          // Use a dummy wallet for read-only program access
          const dummyWallet = { publicKey: null, signTransaction: undefined, sendTransaction: undefined };
          const program = getProgram(dummyWallet);
          if (program) {
            const accounts = await program.account.market.all();
            onChainMarkets = accounts.map((acc: any) => {
              const m = acc.account;
              return {
                id: m.marketId.toNumber(),
                question: m.question,
                marketPublicKey: acc.publicKey.toString(), // Store the actual PDA string
                endTime: m.endTime.toNumber(),
                category: 'CRYPTO', // Default
                outcomes: m.outcomeNames.filter((n: string) => n !== ""),
                totals: m.totals.map((t: any) => t.toNumber()),
                totalLiquidity: m.totalLiquidity.toNumber(),
                resolved: m.resolved,
                winningOutcome: m.winningOutcome,
                polymarketId: m.polymarketId || null,
                isHot: m.totalLiquidity.toNumber() > 100000
              };
            });
            console.log(`Fetched ${onChainMarkets.length} global markets from chain`);
          }
        } catch (onChainErr) {
          console.warn("Failed to fetch on-chain markets:", onChainErr);
        }

        // Create Map for fast lookup of ON-CHAIN markets
        const onChainMap = new Map();
        onChainMarkets.forEach(m => {
          if (m.polymarketId) {
            // If it has a polymarket ID, store it
            onChainMap.set(m.polymarketId, m);
          }
        });

        // 3. Merge Logic:
        // Start with User Created Markets (that are NOT proxy wrappers)
        const pureUserMarkets = getUserMarkets();

        const mergedList = dailyMarkets.map(polyItem => {
          // CHECK: Does this exist on-chain?
          const onChainMatch = onChainMap.get(polyItem.polymarketId);

          if (onChainMatch) {
            // YES: Return the On-Chain version (Real Betting Enabled)
            // But keep some metadata from Polymarket if helpful (like sparkline or slug if missing)
            return {
              ...onChainMatch,
              marketPublicKey: onChainMatch.marketPublicKey,
              slug: polyItem.slug,
              eventTitle: polyItem.eventTitle,
              description: polyItem.description,
              isHot: onChainMatch.totalLiquidity > 50000 || polyItem.isHot, // Combined Hotness
              isOnChain: true // Explicit flag
            };
          } else {
            // NO: Return raw Polymarket item (Simulation Mode)
            return {
              ...polyItem,
              isOnChain: false
            };
          }
        });

        // Add pure user markets (that might not be in the daily feed)
        // And also add any on-chain markets that didn't match (maybe manual creations?)
        const finalPredictions = [...mergedList];

        // Add manual markets that aren't polymarket proxies
        pureUserMarkets.forEach(m => {
          if (!finalPredictions.find(f => f.id === m.id)) finalPredictions.push({ ...m, isOnChain: false }); // Local legacy
        });

        // Add OnChain markets that weren't matched (e.g. pure manual on-chain markets)
        onChainMarkets.forEach(m => {
          // If it has no polymarket ID, it's a pure manual market
          // If it HAS one but somehow wasn't in our refined daily list (rare, but possible if curation changed)
          if (!finalPredictions.find(f => f.id === m.id)) {
            finalPredictions.push({ ...m, isOnChain: true });
          }
        });

        // Resolution Status Check
        const resolvedList = finalPredictions.map(m => {
          const res = getResolutionStatus(m.id);
          if (res) {
            return {
              ...m,
              resolved: true,
              winningOutcome: res === 'yes' ? 0 : 1
            };
          }
          if (m.status === 'resolved') return { ...m, resolved: true, winningOutcome: 0 };
          return m;
        });

        // Unique filter by id to prevent duplicates
        const uniqueById = resolvedList.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

        // Aggressive Deduplication for "Up or Down" markets
        const unique = uniqueById.filter((v, i, a) => {
          const isCrypto = v.category === 'CRYPTO' || v.question.includes('Bitcoin') || v.question.includes('Ethereum');
          if (!isCrypto) return true;

          const dateStr = new Date(v.endTime * 1000).toDateString();
          const asset = v.question.toLowerCase().includes('bitcoin') ? 'btc'
            : v.question.toLowerCase().includes('ethereum') ? 'eth'
              : v.question.toLowerCase().includes('solana') ? 'sol' : v.question;

          return a.findIndex(t => {
            const tDate = new Date(t.endTime * 1000).toDateString();
            const tAsset = t.question.toLowerCase().includes('bitcoin') ? 'btc'
              : t.question.toLowerCase().includes('ethereum') ? 'eth'
                : t.question.toLowerCase().includes('solana') ? 'sol' : t.question;
            return tAsset === asset && tDate === dateStr;
          }) === i;
        });

        setPredictions(unique);
        setFetchError(unique.length === 0 ? "No markets found." : false);
      } catch (e) {
        console.error("Fetch Error:", e);
        setFetchError(e instanceof Error ? e.message : "Network error");
      } finally {
        setIsLoading(false);
      }
    }
    loadBackgroundData();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Live Odds Polling (Every 5s)
  useEffect(() => {
    if (predictions.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const { refreshMarketBatch } = await import('@/services/polymarket');
        // Only refresh Polymarket items (filtered by ID assumption or property)
        // Actually, our API handles missing IDs gracefully.
        const ids = predictions.filter(p => p.polymarketId).map(p => p.id);

        if (ids.length === 0) return;

        const updates = await refreshMarketBatch(ids);

        if (updates.length > 0) {
          setPredictions(prev => prev.map(p => {
            const update = updates.find(u => u.id === p.id);
            if (update) {
              // Merge updates (Liquidity, Odds/Totals)
              return {
                ...p,
                totals: update.totals,
                totalLiquidity: update.totalLiquidity,
                outcomes: update.outcomes // In case names change (rare)
              };
            }
            return p;
          }));
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [predictions]); // Restart timer on update (Throttle behavior)

  // Derived Sorted List Logic
  const filtered = predictions.filter(m => {
    // A market is resolved if the flag is set OR if we have a persisted resolution OR if it's explicitly marked in status
    const isResolved = m.resolved === true || getResolutionStatus(m.id) !== null || (m.status === 'resolved');
    const viewingResolved = activeCategory === 'resolved';

    // 1. Category Filter
    const matchesCat = viewingResolved
      ? isResolved
      : (activeCategory === 'all' || m.category?.toLowerCase() === activeCategory.toLowerCase());

    // 2. Resolved Filter (Don't show resolved in active categories)
    const matchesResolved = viewingResolved ? isResolved : !isResolved;

    // 3. Search Filter
    const matchesSearch = !searchQuery || m.question?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesResolved && matchesSearch;
  });

  const sortedPredictions = [...filtered].sort((a, b) => {
    if (sortBy === 'volume') return (b.totalVolume || 0) - (a.totalVolume || 0);
    if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
    if (sortBy === 'ending') return (a.endTime || 0) - (b.endTime || 0);
    return 0;
  });

  const hotMarkets = sortedPredictions.filter(m => m.isHot).slice(0, 6);
  const endingSoon = sortedPredictions.filter(m => !m.isHot).slice(0, 6);
  const allOthers = sortedPredictions.slice(0, 30);

  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-purple-500/30 pb-24 md:pb-0 relative overflow-x-hidden">
      <Background activeCategory={activeCategory} />

      <div className="relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                POLYBET
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-gray-900 border border-white/5 rounded-lg text-[9px] md:text-[10px] font-mono group">
                <span className="hidden md:inline text-gray-500 uppercase">CA:</span>
                <span className="text-gray-400">{CONTRACT_ADDRESS === 'COMING SOON' ? CONTRACT_ADDRESS : `${(CONTRACT_ADDRESS as string).slice(0, 4)}...${(CONTRACT_ADDRESS as string).slice(-4)}`}</span>
                <button onClick={copyToClipboard} className="text-purple-500 hover:text-purple-400 transition-colors p-1">
                  {copied ? <Check size={10} className="md:w-3 md:h-3" /> : <Copy size={10} className="md:w-3 md:h-3" />}
                </button>
              </div>

              <a
                href={CONTRACT_ADDRESS === 'COMING SOON' ? '#' : `https://pump.fun/${CONTRACT_ADDRESS}`}
                target={CONTRACT_ADDRESS === 'COMING SOON' ? '_self' : '_blank'}
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-[9px] md:text-[10px] font-black uppercase tracking-tighter px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-lg shadow-purple-500/20 active:scale-95 transition-all outline-none"
              >
                Buy <span className="hidden md:inline">$POLYBET</span>
              </a>

              <a
                href="https://x.com/Polybet_Labs"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-400 transition-colors bg-gray-900 border border-white/5 rounded-lg md:flex hidden"
                title="Follow us on Twitter"
              >
                <Twitter size={16} />
              </a>

              <button
                onClick={() => setIsDashboardOpen(true)}
                className="hidden sm:flex text-xs font-bold text-gray-400 hover:text-white transition-colors items-center gap-2"
              >
                Dashboard
              </button>
              <button
                onClick={() => setIsPositionsOpen(true)}
                className="hidden md:flex text-xs md:text-sm font-bold text-gray-400 hover:text-white transition-colors items-center gap-2"
              >
                My Bets
              </button>
              <WalletConnect />
            </div>
          </div>
        </div>

        <ActivityTicker />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-8">
          <CreateMarketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
          <UserPositions isOpen={isPositionsOpen} onClose={() => setIsPositionsOpen(false)} />
          <MarketWarRoom isOpen={isWarRoomOpen} onClose={() => setIsWarRoomOpen(false)} market={selectedMarket} /> {/* Added MarketWarRoom */}
          <TraderDashboard isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} walletAddress={publicKey?.toString()} />

          {/* Featured Market Section */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Featured Prediction</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                <Plus size={14} />
                Create Market
              </button>
            </div>

            {isLoading ? (
              <div className="h-[480px] w-full rounded-3xl bg-gray-900/20 border border-gray-800 overflow-hidden relative" />
            ) : fetchError ? (
              <div className="h-[480px] w-full rounded-3xl bg-red-950/20 border border-red-900/50 flex items-center justify-center p-8">
                <h3 className="text-red-400 font-bold">Failed to load live data.</h3>
              </div>
            ) : (
              <FeaturedMarket
                data={predictions[0]}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onOpenExpanded={() => openWarRoom(predictions[0])}
              />
            )}
          </section>

          {/* Discovery & Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 sticky top-[60px] md:top-[72px] z-40 bg-[#020617]/90 backdrop-blur-xl py-3 md:py-5 border-b border-white/5">
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <NavCategories active={activeCategory} onSelect={setActiveCategory} />

              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">Sort By:</span>
                {[
                  { id: 'volume', label: '🔥 Volume' },
                  { id: 'newest', label: '✨ Newest' },
                  { id: 'ending', label: '⏳ Ending' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id as any)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${sortBy === option.id
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-72 bg-gray-900/50 border border-white/5 focus:border-purple-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all placeholder:text-gray-600 focus:bg-gray-900"
              />
            </div>
          </div>

          {/* Prediction Grids */}
          <div className="space-y-12 pb-20">
            {activeCategory !== 'all' || searchQuery ? (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">Search Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedPredictions.slice(0, 30).map((p) => (
                    <PredictionCard
                      key={p.id}
                      {...p}
                      onOpenExpanded={() => openWarRoom(p)}
                      onSettle={handleSettle}
                      slug={p.slug}
                      eventTitle={p.eventTitle}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <>
                <section>
                  <h2 className="text-2xl font-bold text-white mb-6">🔥 Hot Right Now</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hotMarkets.map((p) => (
                      <PredictionCard
                        key={p.id}
                        {...p}
                        onOpenExpanded={() => openWarRoom(p)}
                        onSettle={handleSettle}
                        slug={p.slug}
                        eventTitle={p.eventTitle}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-6">⏳ Ending Soon</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {endingSoon.map((p) => (
                      <PredictionCard
                        key={p.id}
                        {...p}
                        onOpenExpanded={() => openWarRoom(p)}
                        onSettle={handleSettle}
                        slug={p.slug}
                        eventTitle={p.eventTitle}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-6">Explore All</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allOthers.map((p) => (
                      <PredictionCard
                        key={p.id}
                        {...p}
                        onOpenExpanded={() => openWarRoom(p)}
                        onSettle={handleSettle}
                        slug={p.slug}
                        eventTitle={p.eventTitle}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          <section className="pt-8 border-t border-gray-800">
            <HowItWorks />
          </section>
        </div>

        {/* Footer Placeholder for simplicity, restore fully later if needed */}
        <div className="border-t border-gray-800 bg-gray-950 py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-500/5 [mask-image:radial-gradient(circle_at_center,white,transparent)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono group">
                <span className="text-gray-500 uppercase">Contract:</span>
                <span className="text-gray-300">{CONTRACT_ADDRESS}</span>
                {CONTRACT_ADDRESS !== 'COMING SOON' && (
                  <button onClick={copyToClipboard} className="text-purple-500 hover:text-purple-400 transition-colors ml-1 p-1">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                )}
              </div>

              <div className="space-y-4 max-w-2xl px-4">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-[0.2em]">Polybet © 2025</p>
                <p className="text-gray-600 text-[10px] leading-relaxed italic">
                  Polybet is a decentralized prediction protocol in Beta. All participation is at your own risk.
                  Digital assets are highly volatile. This is not financial advice.
                  Be the Alpha, or be the exit liquidity.
                </p>
              </div>

              <div className="flex items-center gap-8 mt-4">
                <a href={CONTRACT_ADDRESS === 'COMING SOON' ? '#' : `https://pump.fun/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener" className="text-xs font-black text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-widest">Pump.fun</a>
                <a href="https://x.com/Polybet_Labs" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-widest">Twitter (X)</a>
                <a href="#" className="text-xs font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest">Docs</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileNav
        onOpenSearch={() => setActiveCategory('all')}
        onOpenMyBets={() => setIsPositionsOpen(true)}
        onScrollTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </main>
  );
}
