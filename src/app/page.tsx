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
              <div className="h-[480px] w-full rounded-3xl bg-gray-900/20 border border-gray-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                <div className="p-10 space-y-8 h-full flex flex-col justify-center">
                  <div className="space-y-4">
                    <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
                    <div className="h-12 w-3/4 bg-gray-800 rounded animate-pulse" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-20 w-full bg-gray-800 rounded animate-pulse" />
                    <div className="h-20 w-full bg-gray-800 rounded animate-pulse" />
                  </div>
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

          {/* Categorized Sections */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-2xl font-outfit font-bold text-white">Trending Predictions</h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 glass rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {predictions.slice(0, 12).map((prediction, index) => (
                  <motion.div
                    key={prediction.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PredictionCard {...prediction} />
                  </motion.div>
                ))}
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
