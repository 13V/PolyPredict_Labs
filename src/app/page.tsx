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

import { fetchPolymarketTrending } from '@/services/polymarket';
import { generateSyntheticMarkets } from '@/data/synthetic';
import { realSnapshot } from '@/data/real_snapshot';
import { getUserMarkets } from '@/utils/marketStorage';

// Data loaded dynamically

const CONTRACT_ADDRESS = 'HqQqPtf7FgFySXDHrTzExbGKUt4axd1JJQRDr9kZpump';

export default function Home() {
  const [copied, setCopied] = useState(false);
  // Initialize with snapshot for immediate content (Fail-safe)
  // Initialize empty - pure Real Data
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<boolean | string>(false);

  useEffect(() => {
    async function loadBackgroundData() {
      try {
        console.log("Fetching live data...");
        setIsLoading(true);

        // Fetch a large batch to work with
        const allEvents = await fetchPolymarketTrending(100);

        if (allEvents.length === 0) {
          console.warn("API returned 0 events.");
          setFetchError(true);
          setIsLoading(false);
          return;
        }

        let finalDisplayList: any[] = [];

        // 1. Priority: Daily Markets (< 24h or keywords)
        const dailyMarkets = allEvents.filter((e: any) => {
          const title = e.title.toLowerCase();
          const isDailyKeyword = title.includes('daily') || title.includes('today') || title.includes('tomorrow') || title.includes('tonight');

          let isEndingSoon = false;
          if (e.endDate) {
            const end = new Date(e.endDate).getTime();
            const now = Date.now();
            const hoursLeft = (end - now) / (1000 * 60 * 60);
            isEndingSoon = hoursLeft > 0 && hoursLeft < 24;
          }
          return isDailyKeyword || isEndingSoon;
        });

        finalDisplayList = [...dailyMarkets];

        // 2. Fallback: If < 25, add Short-Term Markets (< 72h)
        if (finalDisplayList.length < 25) {
          const shortTermMarkets = allEvents.filter((e: any) => {
            // Avoid duplicates
            if (finalDisplayList.find(existing => existing.id === e.id)) return false;

            if (e.endDate) {
              const end = new Date(e.endDate).getTime();
              const hoursLeft = (end - Date.now()) / (1000 * 60 * 60);
              return hoursLeft > 0 && hoursLeft < 72; // 3 days
            }
            return false;
          });
          finalDisplayList = [...finalDisplayList, ...shortTermMarkets];
        }

        // 3. Fallback: If still < 25, fill with Top Trending
        if (finalDisplayList.length < 25) {
          const needed = 25 - finalDisplayList.length;
          const fillers = allEvents.filter((e: any) => !finalDisplayList.find(existing => existing.id === e.id));
          const topFillers = fillers.slice(0, needed + 5);
          finalDisplayList = [...finalDisplayList, ...topFillers];
        }

        // 4. Merge with User Markets (Keep these, they are real user input)
        const userMarkets = getUserMarkets();

        // Assemble Final List: User -> Live
        const mergedList = [...userMarkets, ...finalDisplayList];

        setPredictions(mergedList);
        setFetchError(false);

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
    <main className="min-h-screen bg-[#020617] text-white selection:bg-purple-500/30">
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
            <WalletConnect />
          </div>
        </div>

        {/* NEW: Activity Ticker */}
        <ActivityTicker />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-8">

          {/* NEW: Featured Market Hero */}
          <CreateMarketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

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

          {/* Dense Market Grid */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-4"
            >
              <h2 className="relative z-10 text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-8 bg-purple-500 rounded-full" />
                Trending Markets
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({predictions.filter(p => activeCategory === 'all' || p.category.toLowerCase() === activeCategory.toLowerCase()).length})
                </span>
              </h2>

              <div className="flex gap-2">
                <span className="px-3 py-1 text-xs font-medium text-purple-400 bg-purple-900/20 border border-purple-500/20 rounded cursor-pointer">🔥 Vol High</span>
                <span className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white cursor-pointer transition-colors">✨ Newest</span>
              </div>
            </motion.div>

            {/* Denser Grid: 1 col mobile, 2 col tablet, 3 col desktop, 4 col huge */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {predictions.filter(p => activeCategory === 'all' || p.category.toLowerCase() === activeCategory.toLowerCase()).map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="h-full"
                >
                  <PredictionCard {...prediction} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Educational/Trust Footer Section (Condensed) */}
          <div className="grid md:grid-cols-2 gap-6 pt-8 border-t border-gray-800">
            <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-2">How it works</h3>
              <p className="text-gray-400 text-sm mb-4">You're trading on the outcome of future events. Share prices between $0.00 and $1.00 reflect the probability of the event occurring.</p>
              <button className="text-purple-400 text-sm font-bold hover:underline">Read Guide →</button>
            </div>

            <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Platform Stats</h3>
                <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-500/20">Live</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Volume</div>
                  <div className="text-xl font-mono text-white">$4.2M</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Traders</div>
                  <div className="text-xl font-mono text-white">12.5K</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">TVL</div>
                  <div className="text-xl font-mono text-white">$850K</div>
                </div>
              </div>
            </div>
          </div>
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
              v0.2.1-CLIENT (Live)
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
    </main >
  );
}
