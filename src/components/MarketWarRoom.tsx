'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Users, MessageSquare, ShieldCheck, Share2 } from 'lucide-react';
import { Sparkline } from './Sparkline';

interface MarketWarRoomProps {
    isOpen: boolean;
    onClose: () => void;
    market: any;
}

export const MarketWarRoom = ({ isOpen, onClose, market }: MarketWarRoomProps) => {
    if (!market) return null;

    // Dynamic Category Coloring (Professional Themes)
    const getCategoryTheme = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes('crypto')) return { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.15)', text: 'text-cyan-400', border: 'border-cyan-500/30' };
        if (c.includes('politics')) return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)', text: 'text-red-400', border: 'border-red-500/30' };
        if (c.includes('sports')) return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)', text: 'text-amber-400', border: 'border-amber-500/30' };
        if (c.includes('esports')) return { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.15)', text: 'text-pink-400', border: 'border-pink-500/30' };
        if (c.includes('news')) return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-400', border: 'border-emerald-500/30' };
        return { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.15)', text: 'text-purple-400', border: 'border-purple-500/30' }; // Default
    };

    const theme = getCategoryTheme(market.category || '');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={onClose} />

                    {/* Content Container */}
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        className="relative w-full max-w-6xl h-full max-h-[90vh] bg-gray-950 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>

                        {/* Left Side: Analysis & Chart */}
                        <div className="flex-1 p-8 md:p-12 overflow-y-auto scrollbar-hide">
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`bg-gray-900 ${theme.text} text-[10px] font-black px-3 py-1 rounded-full border ${theme.border} uppercase tracking-widest`}>
                                    {market.category}
                                </span>
                                <span className="text-gray-500 text-xs font-mono">Market ID: #{market.id}</span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-8">
                                {market.question}
                            </h1>

                            {/* Large Chart Area */}
                            <div className="aspect-[21/9] w-full bg-white/5 rounded-3xl mb-8 relative group overflow-hidden border border-white/5">
                                <div
                                    className="absolute inset-x-0 bottom-0 h-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: `linear-gradient(to top, ${theme.color}20, transparent)` }}
                                />
                                <div className="p-8 h-full flex flex-col">
                                    <div className="flex justify-between items-end mb-auto">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Current Odds</p>
                                            <p className="text-4xl font-black text-white">74% <span className="text-sm text-green-400 ml-2">↑ 4.2%</span></p>
                                        </div>
                                        <TrendingUp style={{ color: theme.color }} size={32} />
                                    </div>
                                    <div className="h-48 w-full">
                                        <Sparkline data={market.sparklineData || [30, 40, 35, 50, 45, 60, 55, 74]} width={800} height={120} color={theme.color} />
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Volume', value: market.totalVolume ? `$${market.totalVolume.toLocaleString()}` : '$0', icon: TrendingUp },
                                    { label: 'Liquidity', value: '$124.5k', icon: ShieldCheck },
                                    { label: 'Traders', value: '1,245', icon: Users },
                                    { label: 'Sentiment', value: 'Bullish', icon: MessageSquare }
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
                            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Place Your Prediction</h3>

                            <div className="space-y-4 flex-1">
                                {market.outcomes?.map((outcome: string, i: number) => (
                                    <button
                                        key={outcome}
                                        className={`w-full group relative overflow-hidden bg-gray-900 border border-white/10 hover:${theme.border.replace('/30', '/50')} p-6 rounded-2xl transition-all text-left`}
                                    >
                                        <div
                                            className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"
                                            style={{ background: `linear-gradient(to r, ${theme.color}10, transparent)` }}
                                        />
                                        <div className="relative z-10 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Outcome {i + 1}</p>
                                                <p className="text-xl font-bold text-white">{outcome}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-mono ${theme.text}`}>Wins: 1.85x</p>
                                                <p className="text-2xl font-black text-white">45%</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 space-y-4">
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
                                    Approve $PROPHET
                                </button>
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
