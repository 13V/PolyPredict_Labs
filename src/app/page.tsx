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

const CONTRACT_ADDRESS = 'HqQqPtf7FgFySXDHrTzExbGKUt4axd1JJQRDr9kZpump';

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
            onChainMarkets = accounts.map(acc => {
              const m = acc.account;
              return {
                id: m.marketId.toNumber(),
                question: m.question,
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

        const userMarkets = getUserMarkets();
        const mergedList = [...userMarkets, ...onChainMarkets, ...dailyMarkets].map(m => {
          const res = getResolutionStatus(m.id);
          if (res) {
            return {
              ...m,
              resolved: true,
              winningOutcome: res === 'yes' ? 0 : 1
            };
          }
          // Also handle legacy/user status
          if (m.status === 'resolved') return { ...m, resolved: true, winningOutcome: 0 };
          return m;
        });

        // Unique filter by id to prevent duplicates
        const uniqueById = mergedList.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

        // Aggressive Deduplication for "Up or Down" markets
        // Filter out multiple markets for the same asset/date to prevent spam and rate limits
        const unique = uniqueById.filter((v, i, a) => {
          const isCrypto = v.category === 'CRYPTO' || v.question.includes('Bitcoin') || v.question.includes('Ethereum');
          if (!isCrypto) return true;

          // Create a "signature" for natural deduplication
          // e.g. "bitcoin-dec-18-2025"
          const dateStr = new Date(v.endTime * 1000).toDateString();
          const asset = v.question.toLowerCase().includes('bitcoin') ? 'btc'
            : v.question.toLowerCase().includes('ethereum') ? 'eth'
              : v.question.toLowerCase().includes('solana') ? 'sol' : v.question;

          // Only keep the first valid occurrence of this Asset + Date combo
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
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                PROPHET PROTOCOL (LIVE)
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-[10px] font-mono group">
                <span className="text-gray-500 uppercase">CA:</span>
                <span className="text-gray-400">{CONTRACT_ADDRESS.slice(0, 4)}...{CONTRACT_ADDRESS.slice(-4)}</span>
                <button onClick={copyToClipboard} className="text-purple-500 hover:text-purple-400 transition-colors">
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>

              <a
                href={`https://pump.fun/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-[10px] font-black uppercase tracking-tighter px-4 py-2 rounded-full shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
              >
                Buy $PROPHET
              </a>

              <button
                onClick={() => setIsDashboardOpen(true)}
                className="text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                Dashboard
              </button>
              <button
                onClick={() => setIsPositionsOpen(true)}
                className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2"
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-[72px] z-40 bg-[#020617]/90 backdrop-blur-xl py-5 border-b border-white/5">
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
        <div className="border-t border-gray-800 bg-gray-950 py-12 text-center">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-gray-400">PROPHET PROTOCOL © 2025</p>
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
