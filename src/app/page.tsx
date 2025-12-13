'use client';
import { WalletConnect } from "@/components/WalletConnect";
import { PredictionCard } from "@/components/PredictionCard";
import { useState, useEffect } from 'react';
import { TrustBadges } from "@/components/TrustBadges";
import { ActivityTicker } from "@/components/ActivityTicker";
import { FeaturedMarket } from "@/components/FeaturedMarket";
import { NavCategories } from "@/components/NavCategories";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Twitter, Send, Copy, Check, Plus } from "lucide-react";
import { CreateMarketModal } from '@/components/CreateMarketModal';
import { UserPositions } from '@/components/UserPositions';
import { MobileNav } from '@/components/MobileNav';
import { HowItWorks } from "@/components/HowItWorks";

import { fetchPolymarketTrending } from '@/services/polymarket';
import { generateSyntheticMarkets } from '@/data/synthetic';
import { realSnapshot } from '@/data/real_snapshot';
import { getUserMarkets } from '@/utils/marketStorage';

// Data loaded dynamically

const CONTRACT_ADDRESS = 'HqQqPtf7FgFySXDHrTzExbGKUt4axd1JJQRDr9kZpump';

export default function Home() {
  const [copied, setCopied] = useState(false);
  // Initialize with snapshot for immediate content (Fail-safe)
  const [isAdmin, setIsAdmin] = useState(false);
  // State for main prediction list
  const [predictions, setPredictions] = useState<any[]>([]); // Keeping original initialization for predictions
  // State for filtering "All Markets"
  const [visibleCount, setVisibleCount] = useState(12);

  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPositionsOpen, setIsPositionsOpen] = useState(false);
  const [fetchError, setFetchError] = useState<boolean | string>(false);

  useEffect(() => {
    async function loadBackgroundData() {
      try {
        console.log("Fetching live data (Strict: < 24h)...");
        setIsLoading(true);

        // NEW: specific fetcher for "50 daily markets"
        const { fetchDailyMarkets } = await import('@/services/polymarket');
        const dailyMarkets = await fetchDailyMarkets(50);

        if (dailyMarkets.length === 0) {
          console.warn("API returned 0 events even after fallback.");
          // Don't error out, just show empty state or user markets
        }

        // 4. Merge with User Markets (Keep these, they are real user input)
        const userMarkets = getUserMarkets();

        // Assemble Final List: User -> Live
        const mergedList = [...userMarkets, ...dailyMarkets];

        console.log(`Displaying ${mergedList.length} markets total.`);
        setPredictions(mergedList);

        if (mergedList.length === 0) {
          setFetchError("No markets found. Try disabling VPN.");
        } else {
          setFetchError(false);
        }

      } catch (e) {
        console.error("Critical Fetch Error:", e);
        setFetchError(e instanceof Error ? e.message : "Unknown error");
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
  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-purple-500/30 pb-24 md:pb-0">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#020617] to-[#020617] pointer-events-none" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

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

        {/* NEW: Activity Ticker */}
        <ActivityTicker />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-8">

          {/* NEW: Featured Market Hero */}
          <CreateMarketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
          <UserPositions isOpen={isPositionsOpen} onClose={() => setIsPositionsOpen(false)} />

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
              <div className="h-[480px] w-full rounded-3xl bg-gray-900/50 animate-pulse border border-gray-800 flex items-center justify-center">
                <div className="text-purple-500/50 flex flex-col items-center gap-4">
                  <Sparkles className="animate-spin" size={48} />
                  <span className="font-mono text-sm">Synchronizing with Polymarket...</span>
                </div>
              </div>
            ) : fetchError ? (
              <div className="h-[480px] w-full rounded-3xl bg-red-950/20 border border-red-900/50 flex items-center justify-center text-center p-8">
                <div>
                  <h3 className="text-red-400 font-bold text-xl mb-2">Connection Failed</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">Error: {typeof fetchError === 'string' ? fetchError : 'Network Error'}</p>
                  <p className="text-xs text-gray-500 mb-6">Try disabling ad-blockers or VPNs.</p>
                  <button onClick={() => window.location.reload()} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <FeaturedMarket data={predictions[0]} onOpenCreateModal={() => setIsCreateModalOpen(true)} />
            )}
          </section>

          {/* NEW: Navigation & Filters */}
          <section>
            <NavCategories active={activeCategory} onSelect={setActiveCategory} />
          </section>

          {/* NEW: Categorized Sections */}

          {/* 1. Trending (Mixed Top 4) */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                <Sparkles className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Trending Now</h2>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:pb-0 md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0">
              {predictions.slice(0, 4).map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="h-full min-w-[85vw] md:min-w-0 snap-center"
                >
                  <PredictionCard {...prediction} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* 2. Sports Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
                <div className="w-5 h-5 text-orange-500 font-black flex items-center justify-center">⚽</div>
              </div>
              <h2 className="text-2xl font-bold text-white">Sports & Competition</h2>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:pb-0 md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0">
              {predictions.filter(p => p.category === 'SPORTS').slice(0, 4).map((prediction, index) => (
                <motion.div key={prediction.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="h-full min-w-[85vw] md:min-w-0 snap-center">
                  <PredictionCard {...prediction} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* 3. Politics Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                <div className="w-5 h-5 text-blue-500 font-black flex items-center justify-center">⚖️</div>
              </div>
              <h2 className="text-2xl font-bold text-white">Political Landscape</h2>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:pb-0 md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0">
              {predictions.filter(p => p.category === 'POLITICS').slice(0, 4).map((prediction, index) => (
                <motion.div key={prediction.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="h-full min-w-[85vw] md:min-w-0 snap-center">
                  <PredictionCard {...prediction} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* 4. Crypto Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                <div className="w-5 h-5 text-purple-500 font-black flex items-center justify-center">🚀</div>
              </div>
              <h2 className="text-2xl font-bold text-white">Crypto & Finance</h2>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:pb-0 md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0">
              {predictions.filter(p => p.category === 'CRYPTO').slice(0, 4).map((prediction, index) => (
                <motion.div key={prediction.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="h-full min-w-[85vw] md:min-w-0 snap-center">
                  <PredictionCard {...prediction} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Explore All (Collapsible or just remaining) */}
          <section className="pt-8 border-t border-gray-800">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">
              All Active Markets ({predictions.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-90 hover:opacity-100 transition-opacity duration-500">
              {predictions.slice(4, visibleCount).map((prediction) => (
                <div key={prediction.id} className="scale-95 origin-center">
                  <PredictionCard {...prediction} />
                </div>
              ))}
            </div>

            {visibleCount < predictions.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  className="px-6 py-2 bg-gray-900 border border-gray-700 rounded-full text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Load More Markets ({predictions.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </section>

          {/* Educational Section */}
          <section className="pt-8 border-t border-gray-800">
            <HowItWorks />
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 bg-gray-950 py-12 text-center">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <span className="text-xl font-bold text-white">PROPHET</span>
            </div>
            <p className="text-gray-400 mb-6">
              Built for degens, by degens. 🚀
            </p>
            <div className="mb-8 text-xs text-gray-600 max-w-2xl mx-auto">
              <p>
                LEGAL DISCLAIMER: $PROPHET is a memecoin with no intrinsic value or expectation of financial return.
                The prediction platform is for entertainment purposes only.
                Nothing on this site constitutes financial advice.
                Cryptocurrency investments are volatile and high-risk.
                Always do your own research (DYOR).
              </p>
            </div>
            <div className="mb-4 text-xs font-mono text-gray-700">
              v0.2.3-STRICT (Live)
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <a href="https://x.com/ProphetProtocol" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Twitter</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Telegram</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Discord</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Whitepaper</a>
            </div>
          </div>
        </div>
      </div>
      <MobileNav
        onOpenSearch={() => setActiveCategory('all')}
        onOpenMyBets={() => setIsPositionsOpen(true)}
        onScrollTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </main >
  );
}
