'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Users, MessageSquare, ShieldCheck, Share2 } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { getPythPrices } from '@/services/pyth';
import { getCoinGeckoSparkline } from '@/services/coingecko';
import { useState, useEffect } from 'react';

interface MarketWarRoomProps {
    isOpen: boolean;
    onClose: () => void;
    market: any;
}

export const MarketWarRoom = ({ isOpen, onClose, market }: MarketWarRoomProps) => {
    const [pythPrice, setPythPrice] = useState<number | null>(null);
    const [pythData, setPythData] = useState<number[] | null>(null);

    // Extraction Logic for "Up/Down" markets
    // Priority: Question -> Slug -> EventTitle -> Description
    const findTarget = () => {
        // Broaden search to include outcomes and description
        const question = market?.question || '';
        const slug = market?.slug || '';
        const eventTitle = market?.eventTitle || '';
        const description = market?.description || '';
        const outcomes = market?.outcomes || [];

        const fullSource = `${question} ${slug} ${eventTitle} ${description} ${outcomes.join(' ')}`.toLowerCase();

        // 1. Check for standard money format ($96,000)
        const matchMoney = fullSource.match(/\$(\d{1,3}(,\d{3})*(\.\d+)?)/);
        if (matchMoney) return matchMoney[0];

        // 2. Check for "at" followed by price (price at 96000)
        const matchAt = fullSource.match(/at\s+(\d{1,3}k|\d{4,})/);
        if (matchAt) return `$${matchAt[1]}`;

        // 3. Fallback to numbers (including decimals and 'k'), but EXCLUDE timestamps
        const matchDigits = fullSource.match(/(\$\d+(\.\d+)?k?)|(\d+(\.\d+)?k)|(\d{1,3}(,\d{3})+)|(\d{4,})/gi);
        if (matchDigits) {
            for (const m of matchDigits) {
                const clean = m.replace(/[$,]/g, '').toLowerCase();
                const val = clean.includes('k') ? parseFloat(clean) * 1000 : parseFloat(clean);

                // Numbers between 1 and 1 Billion are likely prices. Above that are likely timestamps.
                if (val > 100 && val < 1000000000) {
                    return m.startsWith('$') ? m : `$${m}`;
                }
            }
        }

        return null;
    };

    const priceTarget = findTarget();

    const isCrypto = market?.category?.toLowerCase().includes('crypto') ||
        market?.question?.toLowerCase().match(/bitcoin|btc|ethereum|eth|solana|sol|price/i) ||
        market?.slug?.toLowerCase().match(/bitcoin|btc|ethereum|eth|solana|sol|price/i);

    // Title Reconstruction Logic
    const reconstructTitle = () => {
        if (!isCrypto || !market) return market?.question;

        const q = market.question.toLowerCase();
        const s = market.slug?.toLowerCase() || '';
        const e = market.eventTitle?.toLowerCase() || '';
        const d = market.description?.toLowerCase() || '';
        const full = `${q} ${s} ${e} ${d}`;

        // 1. Detect "Up or Down" or "Price Prediction" patterns
        if (q.includes('up or down') || s.includes('up-or-down') || e.includes('up or down')) {
            let asset = 'Asset';
            if (full.includes('bitcoin') || full.includes('btc')) asset = 'Bitcoin';
            else if (full.includes('ethereum') || full.includes('eth')) asset = 'Ethereum';
            else if (full.includes('solana') || full.includes('sol')) asset = 'Solana';

            // Extract Time (e.g. 9PM, 10:00AM, December 19)
            const timeMatch = full.match(/(\d{1,2}(:\d{2})?\s*(AM|PM)(\s*ET)?)|((December|January|February|March|April|May|June|July|August|September|October|November)\s+\d{1,2})/i);
            const timeStr = timeMatch ? ` by ${timeMatch[0]}` : '';

            if (priceTarget) {
                return `${asset} above or under ${priceTarget}${timeStr}?`;
            }

            // IF STILL FAILED: Check Description for specific "above $X" or "at $X" text
            if (d) {
                const dMatch = d.match(/(above|at)\s+(\$\d+(\.\d+)?k?|\d{2,})/i);
                if (dMatch) return `${asset} above or under ${dMatch[2]}${timeStr}?`;
            }
        }

        return market.question;
    };

    const displayTitle = reconstructTitle();

    useEffect(() => {
        if (isOpen && isCrypto) {
            console.log(
                `%c[WarRoom] Init: "${market?.question}" | Target: ${priceTarget} | Display: ${displayTitle}`,
                'background: #3b82f6; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
            );
        }
    }, [isOpen, market, priceTarget, isCrypto, displayTitle]);

    // Pyth Integration
    useEffect(() => {
        if (!isOpen || !market) return;

        if (isCrypto) {
            const q = `${market.question} ${market.slug || ''} ${market.eventTitle || ''}`.toLowerCase();
            let symbol = '';
            if (q.includes('bitcoin') || q.includes('btc')) symbol = 'BTC';
            else if (q.includes('ethereum') || q.includes('eth')) symbol = 'ETH';
            else if (q.includes('solana') || q.includes('sol')) symbol = 'SOL';

            if (symbol) {
                // Initial Fetch: Sparkline (once) and Price
                const initFetch = async () => {
                    try {
                        const [{ sparkline }, prices] = await Promise.all([
                            getCoinGeckoSparkline(symbol),
                            getPythPrices([symbol])
                        ]);
                        if (sparkline.length > 0) setPythData(sparkline);
                        if (prices[symbol]) setPythPrice(prices[symbol]);
                    } catch (e) {
                        console.error('WarRoom initial fetch error:', e);
                    }
                };

                // Polling: Only Price (every 5s)
                const pollPrice = async () => {
                    try {
                        const prices = await getPythPrices([symbol]);
                        if (prices[symbol]) setPythPrice(prices[symbol]);
                    } catch (e) {
                        console.error('WarRoom Pyth polling error:', e);
                    }
                };

                initFetch();
                const interval = setInterval(pollPrice, 5000);
                return () => clearInterval(interval);
            }
        }
    }, [isOpen, market, isCrypto]);

    if (!market) return null;

    // Dynamic Category Coloring (Professional Themes)
    const getCategoryTheme = (cat: string) => {
        const c = cat.toLowerCase();
        const q = market.question.toLowerCase();
        if (q.includes(' vs ') || q.includes(' vs. ') || c.includes('sports')) return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)', text: 'text-amber-400', border: 'border-amber-500/30' };

        if (c.includes('crypto')) return { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.15)', text: 'text-cyan-400', border: 'border-cyan-500/30' };
        if (c.includes('politics')) return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)', text: 'text-red-400', border: 'border-red-500/30' };
        if (c.includes('esports')) return { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.15)', text: 'text-pink-400', border: 'border-pink-500/30' };
        if (c.includes('news')) return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-400', border: 'border-emerald-500/30' };
        return { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.15)', text: 'text-purple-400', border: 'border-purple-500/30' }; // Default
    };

    const theme = getCategoryTheme(market.category || '');
    const displayCategory = (market.question.toLowerCase().includes(' vs ') || market.question.toLowerCase().includes(' vs. ')) ? 'SPORTS' : market.category;
    const isExpired = Date.now() > (market.endTime * 1000);
    const resolved = market.resolved;

    const shareToX = () => {
        const text = encodeURIComponent(`I'm predicting on "${market.question}" using @PolyBet! 🔮\n\nPredictions live on Solana. #POLYBET #Solana`);
        const url = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-8"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

                    {/* Content Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-6xl h-full max-h-[92vh] md:max-h-[850px] bg-gray-950 border border-white/10 rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(168,85,247,0.1)]"
                    >
                        {/* Control Buttons */}
                        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                            <button
                                onClick={shareToX}
                                className="p-2.5 bg-gray-900 border border-white/10 rounded-full text-gray-400 hover:text-white hover:border-white/20 transition-all hover:scale-110"
                            >
                                <Share2 size={18} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2.5 bg-gray-900 border border-white/10 rounded-full text-gray-400 hover:text-white hover:border-white/20 transition-all hover:scale-110"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Left Side: Analysis & Chart */}
                        <div className="flex-1 p-5 md:p-12 overflow-y-auto scrollbar-hide">
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`bg-gray-900 ${theme.text} text-[10px] font-black px-3 py-1 rounded-full border ${theme.border} uppercase tracking-widest`}>
                                    {displayCategory}
                                </span>
                                <span className="text-gray-500 text-xs font-mono">Market ID: #{market.id}</span>
                                {isExpired && !resolved && (
                                    <span className="bg-red-500/20 text-red-500 text-[10px] font-black px-3 py-1 rounded-full border border-red-500/30 uppercase tracking-widest">
                                        ENDED
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-5xl font-black text-white leading-tight mb-8">
                                {displayTitle}
                            </h1>

                            {/* Large Chart Area */}
                            <div className="w-full aspect-square md:aspect-[21/9] bg-white/5 rounded-2xl md:rounded-3xl mb-8 relative group overflow-hidden border border-white/5">
                                <div
                                    className="absolute inset-x-0 bottom-0 h-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: `linear-gradient(to top, ${theme.color}20, transparent)` }}
                                />
                                <div className="p-8 h-full flex flex-col">
                                    <div className="flex justify-between items-end mb-auto">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Current Oracle Price</p>
                                            <p className="text-4xl font-black text-white">
                                                {pythPrice ? `$${pythPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '74%'}
                                                {pythPrice ? (
                                                    <span className="text-sm text-green-400 ml-2 animate-pulse">● LIVE</span>
                                                ) : (
                                                    <span className="text-sm text-green-400 ml-2">↑ 4.2%</span>
                                                )}
                                            </p>
                                        </div>
                                        <TrendingUp style={{ color: resolved ? '#4b5563' : theme.color }} size={32} />
                                    </div>
                                    <div className="h-48 w-full">
                                        <Sparkline data={pythData || market.sparklineData || [30, 40, 35, 50, 45, 60, 55, 74]} width={800} height={120} color={resolved ? '#4b5563' : theme.color} />
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Volume', value: market.totalVolume ? `$${market.totalVolume.toLocaleString()}` : '$0', icon: TrendingUp },
                                    { label: 'Liquidity', value: '$124.5k', icon: ShieldCheck },
                                    { label: 'Traders', value: '1,245', icon: Users },
                                    { label: 'Sentiment', value: isExpired ? 'Closed' : 'Bullish', icon: MessageSquare }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2 text-gray-500">
                                            <stat.icon size={12} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                                        </div>
                                        <div className="text-lg font-bold text-white">{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Side: Betting Panel */}
                        <div className="w-full md:w-[400px] bg-white/5 border-l border-white/5 p-8 flex flex-col">
                            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">
                                {isExpired ? 'Market Has Ended' : 'Place Your Prediction'}
                            </h3>

                            <div className="space-y-4 flex-1">
                                {(() => {
                                    const totals = market.totals || [1, 1];
                                    const total = totals.reduce((a: number, b: number) => a + b, 0);

                                    return market.outcomes?.map((outcome: string, i: number) => {
                                        const prob = total > 0 ? (totals[i] / total) * 100 : 50;
                                        // Apply 10% fee on winnings: (Raw - 1) * 0.9 + 1
                                        const rawMultiplier = prob > 0 ? (100 / prob) : 0;
                                        const taxedMultiplier = rawMultiplier > 1 ? ((rawMultiplier - 1) * 0.9 + 1) : rawMultiplier;
                                        const multiplier = taxedMultiplier.toFixed(2);

                                        return (
                                            <button
                                                key={outcome}
                                                disabled={isExpired || resolved}
                                                className={`w-full group relative overflow-hidden bg-gray-900 border border-white/10 ${isExpired ? 'cursor-not-allowed opacity-60' : `hover:${theme.border.replace('/30', '/50')}`} p-6 rounded-2xl transition-all text-left`}
                                            >
                                                <div
                                                    className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"
                                                    style={{ background: isExpired ? 'none' : `linear-gradient(to r, ${theme.color}10, transparent)` }}
                                                />
                                                <div className="relative z-10 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Outcome {i + 1}</p>
                                                        <p className="text-xl font-bold text-white">
                                                            {outcome}
                                                            {priceTarget && (outcome.toLowerCase() === 'up' || outcome.toLowerCase() === 'down' || outcome.toLowerCase() === 'yes' || outcome.toLowerCase() === 'no') && (
                                                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                                                    {(outcome.toLowerCase() === 'up' || outcome.toLowerCase() === 'yes') ? '>' : '<'} {priceTarget}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-xs font-mono ${resolved ? 'text-gray-500' : theme.text}`}>Wins: {multiplier}x</p>
                                                        <p className="text-2xl font-black text-white">{prob.toFixed(0)}%</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            <div className="mt-8 space-y-4">
                                {isExpired ? (
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Market Status</p>
                                        <p className="text-white text-sm font-black">AWAITING FINAL ORACLE SIGNATURE</p>
                                        <div className="mt-4 flex justify-center">
                                            <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    animate={{ x: [-48, 48] }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-1/2 h-full bg-purple-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className="p-4 rounded-xl border text-[11px]"
                                            style={{ backgroundColor: `${theme.color}10`, borderColor: `${theme.color}20`, color: theme.color }}
                                        >
                                            ⚠️ Prediction markets involve capital risk. Always verify the resolving oracle before placing big bites.
                                        </div>
                                        <button
                                            className="w-full py-4 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all"
                                            style={{ backgroundColor: theme.color, boxShadow: `0 10px 20px ${theme.color}20` }}
                                        >
                                            Approve Polybet
                                        </button>
                                    </>
                                )}
                                <button className="w-full py-2 flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors text-xs">
                                    <Share2 size={14} /> Share this market
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
