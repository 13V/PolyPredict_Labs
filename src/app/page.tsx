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
import { Hero } from "@/components/Hero";
import { Background } from "@/components/Background";
import { MarketWarRoom } from "@/components/MarketWarRoom";
import { TraderDashboard } from "@/components/TraderDashboard";
import { Stats } from "@/components/Stats";
import { useWallet } from '@solana/wallet-adapter-react';

import { fetchPolymarketTrending, fetchMarketResult } from '@/services/polymarket';
import { generateSyntheticMarkets } from '@/data/synthetic';
import { realSnapshot } from '@/data/real_snapshot';
import { getUserMarkets, resolveUserMarket } from '@/utils/marketStorage';
import { saveResolution, getResolutionStatus } from '@/utils/voteStorage';

const CONTRACT_ADDRESS: string = '6ZFUNyPDn1ycjhb3RbNAmtcVvwp6oL4Zn6GswnGupump';

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
                isHot: m.totalLiquidity.toNumber() > 100000,
                creator: m.authority.toString()
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

  // Fetch Resolved Markets on Demand
  useEffect(() => {
    if (activeCategory === 'resolved') {
      const fetchResolved = async () => {
        setIsLoading(true);
        try {
          const { fetchPolymarketTrending } = await import('@/services/polymarket');
          // Fetch CLOSED markets
          const resolvedMarkets = await fetchPolymarketTrending(50, 0, 'volume', false, undefined, false, true);

          setPredictions(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newUnique = resolvedMarkets.filter((m: any) => !existingIds.has(m.id));

            if (newUnique.length === 0) return prev;

            // Add resolved flag explicitely just in case
            const markedResolved = newUnique.map((m: any) => ({ ...m, resolved: true, status: 'resolved' }));
            return [...prev, ...markedResolved];
          });
        } catch (e) {
          console.error("Failed to fetch resolved:", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchResolved();
    }
  }, [activeCategory]);

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
    <main className="min-h-screen bg-white text-black selection:bg-black selection:text-white pb-24 md:pb-0 relative overflow-x-hidden">
      <Background activeCategory={activeCategory} />

      <div className="relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-50 border-b-2 border-black bg-white">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 md:px-6 h-14 md:h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl md:text-2xl font-black text-black tracking-tighter italic uppercase">
                POLYPREDICT
              </h1>

              <div className="hidden lg:flex items-center gap-6 border-l-2 border-black pl-6">
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">SYSTEM_CLOCK</span>
                  <span className="text-[10px] font-mono font-bold">{new Date().toISOString().split('T')[1].split('.')[0]} UTC</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">SIG_INTEL</span>
                  <span className="text-[10px] font-mono font-bold text-orange-600 animate-pulse">98.2%_READY</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-white border-2 border-black text-[9px] font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-gray-400 uppercase">FEED_ADDR:</span>
                <span className="text-black">{CONTRACT_ADDRESS === 'COMING SOON' ? CONTRACT_ADDRESS : `${(CONTRACT_ADDRESS as string).slice(0, 4)}...${(CONTRACT_ADDRESS as string).slice(-4)}`}</span>
                <button onClick={copyToClipboard} className="text-black hover:text-orange-600 transition-colors p-[2px]">
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                </button>
              </div>

              <div className="flex items-center border-l-2 border-black h-16 md:h-20 ml-2">
                <button
                  onClick={() => setIsDashboardOpen(true)}
                  className="px-4 h-full hidden sm:flex items-center text-[10px] font-black text-black uppercase tracking-widest hover:bg-orange-500 transition-colors border-r border-black/10"
                >
                  STATS
                </button>
                <button
                  onClick={() => setIsPositionsOpen(true)}
                  className="px-4 h-full hidden md:flex items-center text-[10px] font-black text-black uppercase tracking-widest hover:bg-orange-500 transition-colors"
                >
                  MY_BOOK
                </button>
              </div>

              <div className="pl-4 border-l-2 border-black h-16 md:h-20 flex items-center">
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>

        <ActivityTicker />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-8">
          <CreateMarketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
          <UserPositions isOpen={isPositionsOpen} onClose={() => setIsPositionsOpen(false)} />
          <MarketWarRoom isOpen={isWarRoomOpen} onClose={() => setIsWarRoomOpen(false)} market={selectedMarket} /> {/* Added MarketWarRoom */}
          <TraderDashboard isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} walletAddress={publicKey?.toString()} />

          <section>
            <Hero />
          </section>

          <Stats marketCount={predictions.length} />

          {/* Discovery & Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 sticky top-[56px] md:top-[64px] z-40 bg-white py-4 md:py-6 border-b-2 border-black">
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-600 animate-pulse" />
                <span className="text-[9px] font-black text-black uppercase tracking-[0.2em] italic">DISCOVERY_STREAM / {activeCategory.toUpperCase()}</span>
              </div>
              <NavCategories active={activeCategory} onSelect={setActiveCategory} />

              <div className="flex items-center gap-0 border border-black w-fit">
                <div className="px-3 py-1.5 bg-gray-50 border-r border-black text-[8px] font-black text-black/40 uppercase tracking-[0.2em] italic">
                  SORT_BY
                </div>
                {[
                  { id: 'volume', label: 'VOLUME' },
                  { id: 'newest', label: 'NEWEST' },
                  { id: 'ending', label: 'ENDING' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id as any)}
                    className={`px-4 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all border-r last:border-r-0 border-black ${sortBy === option.id
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-gray-50'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative group flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="PROBE_SYNTACTIC_FEED..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-black focus:bg-white pl-10 pr-4 py-3 text-[10px] font-black uppercase outline-none transition-all placeholder:text-gray-300 italic"
                />
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-orange-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none whitespace-nowrap italic"
              >
                <Plus size={14} strokeWidth={3} />
                INITIALIZE_MARKET
              </button>
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
                  <h2 className="text-3xl font-black text-black mb-8 italic uppercase tracking-tighter border-l-8 border-black pl-4">HOT_DATA_FEED</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            {/* Mission status footer */}
          </section>
        </div>

        {/* Footer */}
        <div className="border-t-4 border-black bg-white py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-20" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center gap-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black text-[10px] font-mono font-black">
                <span className="text-gray-400 uppercase">CONTRACT_IDENT:</span>
                <span>{CONTRACT_ADDRESS}</span>
              </div>

              <div className="space-y-4 max-w-2xl px-4">
                <p className="text-black text-sm font-black uppercase tracking-[0.3em] italic underline">POLYPREDICT_TERMINAL_BETA</p>
                <p className="text-black text-[11px] leading-relaxed font-black uppercase opacity-60">
                  Precision forecasting. Verifiable outcomes. Decentralized intelligence.
                  This protocol is in experimental preview. Trade at your own risk.
                </p>
              </div>

              <div className="flex items-center gap-12 mt-4">
                <a href={CONTRACT_ADDRESS === 'COMING SOON' ? '#' : `https://pump.fun/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener" className="text-xs font-black text-black hover:text-orange-600 transition-colors uppercase tracking-[0.2em]">PUMP_TERMINAL</a>
                <a href="https://x.com/PolyPredict_AI" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-black hover:text-orange-600 transition-colors uppercase tracking-[0.2em]">X_INTEL</a>
                <a href="#" className="text-xs font-black text-black hover:text-orange-600 transition-colors uppercase tracking-[0.2em]">PROTOCOL_DOCS</a>
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
