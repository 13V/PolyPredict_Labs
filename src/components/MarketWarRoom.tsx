'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Users, MessageSquare, ShieldCheck, Share2, Zap, Swords, Gavel, Newspaper, Tv, Globe, Activity } from 'lucide-react';
import { TeamLogo } from './TeamLogo';
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
    const [lastPriceUpdate, setLastPriceUpdate] = useState(0);

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
    // Display category override
    const displayCategory = (market.question.toLowerCase().includes(' vs ') || market.question.toLowerCase().includes(' vs. ')) ? 'SPORTS' : market.category;

    // Team Parsing Logic for Sports (Enhanced)
    const getTeams = () => {
        const question = market?.question || '';
        const slug = market?.slug || '';
        const eventTitle = market?.eventTitle || '';
        const fullSource = `${question} ${slug} ${eventTitle}`.toLowerCase();

        // 1. Explicit "vs", " vs. ", or " @ " check
        if (fullSource.includes(' vs ') || fullSource.includes(' vs. ') || fullSource.includes(' @ ')) {
            const parts = (eventTitle || question).split(/ vs\.? | @ /i);
            if (parts.length === 2) {
                return [
                    parts[0].replace(/^Will\s+/i, '').replace(/\s+win\??$/i, '').replace(/Spread:\s+/i, '').replace(/Total:\s+/i, '').trim(),
                    parts[1].replace(/\s+win\??$/i, '').replace(/\?$/, '').trim()
                ];
            }
        }

        // 2. Fallback to binary outcomes if category is SPORTS
        const isSport = (market?.category || '').toLowerCase().includes('sport') || (displayCategory === 'SPORTS');
        if (isSport && market?.outcomes?.length === 2) {
            // Filter out generic Yes/No
            if (!['YES', 'NO'].includes(market.outcomes[0].toUpperCase())) {
                return [market.outcomes[0], market.outcomes[1]];
            }
        }

        return null;
    };

    const teams = getTeams();

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
                        if (prices[symbol]) {
                            if (prices[symbol] !== pythPrice) setLastPriceUpdate(Date.now());
                            setPythPrice(prices[symbol]);
                        }
                    } catch (e) {
                        console.error('WarRoom initial fetch error:', e);
                    }
                };

                // Polling: Only Price (every 5s)
                const pollPrice = async () => {
                    try {
                        const prices = await getPythPrices([symbol]);
                        if (prices[symbol]) {
                            if (prices[symbol] !== pythPrice) setLastPriceUpdate(Date.now());
                            setPythPrice(prices[symbol]);
                        }
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
        if (q.includes(' vs ') || q.includes(' vs. ') || c.includes('sports')) return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)', text: 'text-amber-600', border: 'border-amber-600/30' };

        if (c.includes('crypto')) return { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.15)', text: 'text-cyan-600', border: 'border-cyan-600/30' };
        if (c.includes('politics')) return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)', text: 'text-red-600', border: 'border-red-600/30' };
        if (c.includes('esports')) return { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.15)', text: 'text-pink-600', border: 'border-pink-600/30' };
        if (c.includes('news')) return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-600', border: 'border-emerald-600/30' };
        return { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.15)', text: 'text-purple-600', border: 'border-purple-600/30' }; // Default
    };

    const getCategoryIcon = (cat: string) => {
        const c = (cat || '').toLowerCase();
        const q = (market.question || '').toLowerCase();
        if (q.includes(' vs ') || q.includes(' vs. ') || c.includes('sport')) return Swords;
        if (c.includes('crypto')) return Zap;
        if (c.includes('politics')) return Gavel;
        if (c.includes('news')) return Newspaper;
        if (c.includes('pop') || c.includes('culture') || c.includes('movie')) return Tv;
        if (c.includes('science') || c.includes('tech')) return Globe;
        return Activity;
    };

    const CategoryIcon = getCategoryIcon(market.category || '');
    const theme = getCategoryTheme(market.category || '');
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
                    className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60" onClick={onClose} />

                    {/* Content Container */}
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 10 }}
                        className="relative w-full max-w-6xl h-full max-h-[100vh] md:max-h-[850px] bg-white border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row overflow-hidden pl-2"
                    >
                        {/* Team Background Watermarks */}
                        {teams && (
                            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden grayscale opacity-30">
                                <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-[800px] h-[800px] rotate-[-12deg]">
                                    <TeamLogo name={teams[0]} className="w-full h-full" />
                                </div>
                                <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-[800px] h-[800px] rotate-[12deg]">
                                    <TeamLogo name={teams[1]} className="w-full h-full" />
                                </div>
                            </div>
                        )}
                        {/* Signal Sidebar */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-2 z-[70]"
                            style={{ backgroundColor: theme.color }}
                        />
                        {/* Status Bar */}
                        <div className="absolute top-0 inset-x-0 h-6 bg-black flex items-center justify-between px-4 z-[60]">
                            <div className="flex items-center gap-4 text-[8px] font-mono font-black text-white uppercase tracking-widest">
                                <span>TERMINAL_SESSION: {market.id}</span>
                                <span className="text-orange-600 animate-pulse">● LIVE_FEED</span>
                            </div>
                            <div className="flex items-center gap-4 text-[8px] font-mono font-black text-white/40 uppercase tracking-widest">
                                <span>PROTOCOL: POLYPREDICT_V0.1</span>
                                <span>NETWORK: SOLANA_MAINNET</span>
                            </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="absolute top-10 right-6 z-50 flex items-center gap-3">
                            <button
                                onClick={shareToX}
                                className="p-2 bg-white border-2 border-black text-black hover:bg-black hover:text-white transition-all hover:translate-y-[-2px] hover:neo-shadow-sm active:translate-y-0 active:shadow-none"
                            >
                                <Share2 size={16} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 bg-white border-2 border-black text-black hover:bg-black hover:text-white transition-all hover:translate-y-[-2px] hover:neo-shadow-sm active:translate-y-0 active:shadow-none"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Left Side: Analysis & Chart */}
                        <div className="flex-1 p-6 md:p-12 overflow-y-auto pt-16 md:pt-16">
                            <div className="flex items-center gap-0">
                                <div className="flex items-center gap-2 px-3 py-1 bg-black text-white border-y border-l border-black italic">
                                    <CategoryIcon size={12} strokeWidth={3} className="text-orange-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {displayCategory}_INTEL
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 border border-black bg-white text-black font-mono text-[10px] font-bold">
                                    REF_ID: #{market.id.toString().padStart(4, '0')}
                                </div>
                            </div>
                            <span className="text-black/60 text-[10px] font-mono font-black uppercase tracking-widest">ADDR: {market.id.toString().slice(0, 12)}...</span>
                            {isExpired && !resolved && (
                                <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 border border-black uppercase tracking-widest animate-pulse">
                                    THROTTLE_LOCKED
                                </span>
                            )}

                            <h1 className="text-3xl md:text-6xl font-black text-black leading-[0.9] mb-10 tracking-tighter uppercase italic">
                                {displayTitle}
                            </h1>

                            {/* Large Chart Area */}
                            <div className="w-full aspect-square md:aspect-[21/9] bg-white border-2 border-black mb-10 relative group overflow-hidden">
                                <div className="absolute inset-0 dot-grid opacity-5" />
                                <div className="p-8 h-full flex flex-col relative z-10">
                                    <div className="flex justify-between items-end mb-auto">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <motion.div
                                                    animate={{ opacity: [1, 0, 1] }}
                                                    transition={{ duration: 0.8, repeat: Infinity }}
                                                    className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                                />
                                                <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] animate-pulse">ORACLE_LIVE_FEED</p>
                                            </div>
                                            <p
                                                key={lastPriceUpdate}
                                                className="text-5xl font-black text-black font-mono tracking-tighter animate-price-glitch"
                                            >
                                                {pythPrice ? `$${pythPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '74.00%'}
                                                {pythPrice ? (
                                                    <span className="text-[10px] text-orange-600 ml-3 animate-pulse italic font-black uppercase tracking-widest">● SIGNAL_STABLE</span>
                                                ) : (
                                                    <span className="text-[10px] text-orange-600 ml-3 italic font-black uppercase tracking-widest">↑ 4.2%_VOL</span>
                                                )}
                                            </p>
                                        </div>
                                        <TrendingUp className="text-black opacity-20" size={48} />
                                    </div>
                                    <div className="h-48 w-full mt-4">
                                        <Sparkline
                                            data={pythData || market.sparklineData || [30, 40, 35, 50, 45, 60, 55, 74, 70, 85]}
                                            width={1000}
                                            height={150}
                                            color="#ff5722"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-black">
                                {[
                                    { label: 'Total Volume', value: market.totalLiquidity ? market.totalLiquidity.toLocaleString() : '0', icon: TrendingUp },
                                    { label: 'Liquidity', value: '$124,500', icon: ShieldCheck },
                                    { label: 'Active Traders', value: '1,245', icon: Users },
                                    { label: 'Sentiment', value: isExpired ? 'CLOSED' : 'BULLISH', icon: MessageSquare }
                                ].map((stat, i) => (
                                    <div key={i} className="border-black md:border-r-2 last:border-r-0 p-6 bg-white hover:bg-black hover:text-white transition-colors group">
                                        <div className="flex items-center gap-2 mb-3 text-gray-500 group-hover:text-white/60">
                                            <stat.icon size={12} strokeWidth={3} />
                                            <span className="text-[8px] font-black uppercase tracking-widest font-outfit">{stat.label}</span>
                                        </div>
                                        <div className="text-xl font-black font-mono tracking-tight uppercase italic">{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Technical Provenance */}
                            <div className="mt-8 pt-4 flex justify-between items-center border-t border-dashed border-black/10">
                                <span className="text-[8px] font-mono text-black/60 uppercase tracking-[0.2em]">TRACE_LAYER: SOLANA_MAINNET_L2</span>
                                <span className="text-[8px] font-mono text-black/60 uppercase tracking-[0.2em]">ORACLE: {isCrypto ? 'PYTH_NETWORK' : 'POLYMARKET_SETTLEMENT_CORE'}</span>
                            </div>
                        </div>

                        {/* Right Side: Betting Panel */}
                        <div className="w-full md:w-[420px] bg-gray-50 border-t-2 md:border-t-0 md:border-l-2 border-black p-8 flex flex-col pt-16 md:pt-16">
                            <h3 className="text-xl font-black text-black mb-8 uppercase tracking-tighter italic leading-none border-b-2 border-black pb-4">
                                {isExpired ? 'MARKET_SETTLED' : 'EXECUTE_SELECTION'}
                            </h3>

                            <div className="space-y-4 flex-1">
                                {(() => {
                                    const totals = market.totals || [1, 1];
                                    const total = totals.reduce((a: number, b: number) => a + b, 0);

                                    return market.outcomes?.map((outcome: string, i: number) => {
                                        const prob = total > 0 ? (totals[i] / total) * 100 : 50;
                                        const rawMultiplier = prob > 0 ? (100 / prob) : 0;
                                        const taxedMultiplier = rawMultiplier > 1 ? ((rawMultiplier - 1) * 0.9 + 1) : rawMultiplier;
                                        const multiplier = taxedMultiplier.toFixed(2);

                                        return (
                                            <button
                                                key={outcome}
                                                disabled={isExpired || resolved}
                                                className={`w-full group relative overflow-hidden bg-white border-2 border-black ${isExpired ? 'cursor-not-allowed opacity-40' : 'hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(255,87,34,1)]'} p-6 transition-all text-left`}
                                            >
                                                <div
                                                    className={`absolute inset-0 bg-orange-600 transition-all duration-300 opacity-0 group-hover:opacity-5`}
                                                />
                                                <div className="relative z-10 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1 italic">STREAM_OUTCOME_{i + 1}</p>
                                                        <p className="text-2xl font-black text-black uppercase tracking-tighter">
                                                            {outcome}
                                                            {priceTarget && (outcome.toLowerCase() === 'up' || outcome.toLowerCase() === 'down' || outcome.toLowerCase() === 'yes' || outcome.toLowerCase() === 'no') && (
                                                                <span className="ml-2 text-xs text-black/40 font-bold font-mono">
                                                                    {(outcome.toLowerCase() === 'up' || outcome.toLowerCase() === 'yes') ? '>' : '<'} {priceTarget}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-[10px] font-mono font-black ${resolved ? 'text-black/40' : 'text-orange-600'}`}>EST_YIELD: {multiplier}x</p>
                                                        <p className="text-3xl font-black text-black font-mono tracking-tighter">{prob.toFixed(0)}%</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            <div className="mt-10 space-y-4">
                                {isExpired ? (
                                    <div className="p-6 border-2 border-black bg-white text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <p className="text-black/40 text-[10px] font-black uppercase tracking-widest mb-2">NETWORK_STATUS</p>
                                        <p className="text-black text-sm font-black italic">AWAITING_ORACLE_CONSENSUS</p>
                                        <div className="mt-4 flex justify-center">
                                            <div className="w-full h-1 bg-gray-100 border border-black overflow-hidden relative">
                                                <motion.div
                                                    animate={{ x: ['-100%', '100%'] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                    className="w-1/3 h-full bg-orange-600 absolute"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(255,87,34,1)] text-[10px] font-mono font-bold text-black uppercase leading-tight italic">
                                            WARNING: CAPITAL_AT_RISK. PREDICTION_PROTOCOL_ACTIVE. VERIFY_INTEL_BEFORE_SIGNING.
                                        </div>
                                        <button
                                            className="w-full py-5 bg-black text-white border-2 border-black font-black text-sm uppercase tracking-[0.3em] italic shadow-[6px_6px_0px_0px_rgba(234,88,12,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(234,88,12,1)] active:translate-y-[2px] active:shadow-none transition-all"
                                        >
                                            APPROVE_PROTOCOL_ACCESS
                                        </button>
                                    </>
                                )}
                                <button onClick={shareToX} className="w-full py-2 flex items-center justify-center gap-2 text-gray-500 hover:text-black transition-colors text-[10px] font-black uppercase tracking-widest italic">
                                    <Share2 size={12} /> BROADCAST_INTEL
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
