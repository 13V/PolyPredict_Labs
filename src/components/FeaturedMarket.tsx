'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Clock, ArrowUpRight, Activity } from 'lucide-react';
import { Sparkline } from './Sparkline';

import { useState, useEffect } from 'react';
import { saveVote } from '@/utils/voteStorage';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/context/ToastContext';
import { useBetSuccess } from '@/context/BetSuccessContext';
import { getPythSparkline } from '@/services/pyth';

interface FeaturedMarketProps {
    data?: {
        id: number;
        question: string;
        category: string;
        timeLeft: string;
        yesVotes: number;
        noVotes: number;
        totalVolume: number;
        outcomeLabels?: string[];
    };
    onOpenCreateModal?: () => void;
    onOpenExpanded?: () => void;
}

export const FeaturedMarket = ({ data, onOpenCreateModal, onOpenExpanded }: FeaturedMarketProps) => {
    const { publicKey, connected, wallet } = useWallet();
    const toast = useToast();
    const { showBetSuccess } = useBetSuccess();
    const [betMode, setBetMode] = useState<'yes' | 'no' | null>(null);
    const [stakeAmount, setStakeAmount] = useState('');
    const [pythData, setPythData] = useState<number[] | null>(null);
    const [pythPrice, setPythPrice] = useState<number | null>(null);

    // Pyth Integration
    useEffect(() => {
        if (data?.category?.toLowerCase().includes('crypto') || data?.question?.toLowerCase().includes('bitcoin')) {
            const q = data?.question?.toLowerCase() || '';
            let symbol = '';
            if (q.includes('bitcoin') || q.includes('btc')) symbol = 'BTC';
            else if (q.includes('ethereum') || q.includes('eth')) symbol = 'ETH';
            else if (q.includes('solana') || q.includes('sol')) symbol = 'SOL';

            if (symbol) {
                const fetchPyth = () => {
                    getPythSparkline(symbol).then(setPythData);
                    import('@/services/pyth').then(m => {
                        m.getPythPrices([symbol]).then(prices => setPythPrice(prices[symbol]));
                    });
                };

                fetchPyth();
                const interval = setInterval(fetchPyth, 10000); // 10s polling
                return () => clearInterval(interval);
            }
        }
    }, [data]);

    const handleConfirmBet = async () => {
        if (!connected || !publicKey) {
            toast.error('Connect wallet to vote!');
            return;
        }

        if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
            toast.error('Enter a valid stake amount');
            return;
        }

        try {
            await saveVote({
                predictionId: data?.id || 999999, // Fallback for featured ID
                choice: betMode as 'yes' | 'no',
                walletAddress: publicKey.toString(),
                timestamp: Date.now(),
                amount: parseFloat(stakeAmount)
            }, wallet?.adapter); // Pass adapter for signing

            // toast.success(`Successfully bet ${stakeAmount} on ${betMode?.toUpperCase()}`); 
            // Replaced with Modal:
            showBetSuccess({
                amount: parseFloat(stakeAmount),
                outcome: betMode as 'yes' | 'no',
                question: data?.question || "Market",
                payoutMultiplier: 1.85
            });

            setBetMode(null);
            setStakeAmount('');
        } catch (e) {
            console.error(e);
            toast.error('Failed to place vote');
        }
    };
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

    const theme = getCategoryTheme(data?.category || 'crypto');

    // Lifecycle Logic
    const isExpired = data?.timeLeft === 'Ended' || (data?.id === 953233);

    // Determine Yes % (default 50 if no data or 0 votes)
    const totalVotes = data ? (data.yesVotes + data.noVotes) : 0;
    const yesPercentage = totalVotes > 0 ? ((data!.yesVotes / totalVotes) * 100) : 50;
    const yesPrice = Math.floor(yesPercentage);
    const noPrice = 100 - yesPrice;

    // Mock data for the big chart (still mock for now as we don't fetch historicals for hero yet)
    const bigChartData = [45, 48, 47, 52, 55, 58, 54, 59, 62, 65, 63, 68, 72, 75, 74, 80, 82, 85];

    return (
        <div
            onClick={onOpenExpanded}
            className="relative group rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-gray-950 cursor-pointer"
        >
            {/* Cinematic Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900/0 to-gray-950/0" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

            {/* Animated Grid Texture Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

            <div className="relative grid lg:grid-cols-5 gap-0 min-h-[auto] lg:min-h-[480px]">
                {/* Left: Chart & Info (3 cols) */}
                <div className="lg:col-span-3 p-5 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 relative">

                    {/* Floating Badge */}
                    <div className="absolute top-5 right-5 md:top-10 md:right-10 flex items-center gap-3">
                        {pythPrice && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-mono font-bold animate-in fade-in slide-in-from-right-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                ${pythPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        )}
                        {isExpired ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400 text-xs font-bold uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                MARKET ENDED
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] md:text-xs font-bold animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                LIVE
                            </div>
                        )}
                    </div>

                    <div className="z-10 mt-8 md:mt-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap">
                            <span className="bg-white/5 border border-white/10 text-white text-[10px] md:text-xs font-mono font-bold px-2 py-1 md:px-3 md:py-1 rounded-sm flex items-center gap-2 tracking-widest uppercase">
                                <TrendingUp size={12} className={theme.text} /> #1 TRENDING
                            </span>
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${theme.text}`}>
                                {data?.category || 'Politics'} • Ends {data?.timeLeft || 'Today'}
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-8 leading-[1.05] tracking-tight">
                            {data?.question || "Will Bitcoin close higher today?"}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 md:gap-10 mt-2 md:mt-4 text-[10px] md:text-xs text-gray-400 font-bold tracking-widest uppercase">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                                    <Activity size={16} className={theme.text} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-600">Volume</span>
                                    <span className="text-white">${data?.totalVolume ? data.totalVolume.toLocaleString() : '4.2M'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                                    <Users size={16} className="text-blue-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-600">Traders</span>
                                    <span className="text-white">12.5K</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Big Chart Area */}
                    <div className="mt-8 md:mt-16">
                        <div className="flex items-end gap-3 md:gap-4 mb-6">
                            <div className="text-5xl md:text-7xl font-black text-white tracking-tighter">{yesPrice}%</div>
                            <div className="text-green-400 font-bold text-sm md:text-lg mb-2 flex items-center gap-1">
                                <ArrowUpRight size={18} />
                                +{(data?.question.length ? (data.question.length % 15) + 1.5 : 12.4).toFixed(1)}% TODAY
                            </div>
                        </div>

                        {/* Seamless Chart Container */}
                        <div className="h-[100px] md:h-[140px] w-full relative overflow-hidden mask-linear-fade">
                            <Sparkline data={pythData || bigChartData} width={800} height={140} color={theme.color} />
                            {/* Gradient Overlay for Fade */}
                            <div
                                className="absolute inset-x-0 bottom-0 h-1/2 opacity-30 pointer-events-none"
                                style={{ background: `linear-gradient(to top, ${theme.color}, transparent)` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Trading Interface (2 cols) */}
                <div className="lg:col-span-2 p-5 md:p-10 bg-white/[0.02] backdrop-blur-md flex flex-col justify-center gap-6 md:gap-8 relative overflow-hidden">
                    {/* Glass Reflection */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="space-y-6 z-10">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">
                                <span>Order Book</span>
                                <span>Spread: 1¢</span>
                            </div>
                            {/* Mock Order Book Visual */}
                            <div className="flex gap-1 h-1.5 md:h-2 w-full rounded-full overflow-hidden bg-gray-800">
                                <motion.div
                                    initial={{ width: '50%' }}
                                    animate={{ width: `${yesPercentage}%` }}
                                    className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                                />
                                <div className="h-full flex-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {betMode ? (
                                <div className="bg-gray-800/80 p-4 md:p-6 rounded-2xl border border-gray-700 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className={`text-lg md:text-xl font-black uppercase tracking-tight ${betMode === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                                            Bet on {betMode === 'yes' ? 'YES' : 'NO'}
                                        </h3>
                                        <button onClick={() => setBetMode(null)} className="text-gray-500 hover:text-white p-2">✕</button>
                                    </div>

                                    <div className="relative mb-4">
                                        <input
                                            type="number"
                                            placeholder="Enter Amount"
                                            value={stakeAmount}
                                            onChange={(e) => setStakeAmount(e.target.value)}
                                            className="w-full bg-black/40 border-2 border-gray-600 focus:border-purple-500 rounded-xl px-4 py-3 text-base md:text-lg text-white placeholder-gray-600 outline-none transition-all"
                                            autoFocus
                                        />
                                        <span className="absolute right-4 top-4 text-xs md:text-sm font-bold text-gray-400">$PROPHET</span>
                                    </div>

                                    <button
                                        onClick={handleConfirmBet}
                                        className={`w-full py-3 md:py-4 rounded-xl text-base md:text-lg font-black uppercase tracking-widest text-white shadow-xl transition-transform active:scale-95 ${betMode === 'yes' ? 'bg-gradient-to-r from-green-600 to-green-500 hover:to-green-400 shadow-green-900/20' : 'bg-gradient-to-r from-red-600 to-red-500 hover:to-red-400 shadow-red-900/20'
                                            }`}
                                    >
                                        CONFIRM BET
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <button
                                        disabled={isExpired}
                                        onClick={(e) => { e.stopPropagation(); connected ? setBetMode('yes') : alert('Connect Wallet!'); }}
                                        className={`group relative overflow-hidden p-4 md:p-6 bg-green-500/10 ${isExpired ? 'cursor-not-allowed opacity-40' : 'hover:bg-green-500/20 border-green-500/20 hover:border-green-500/50'} rounded-2xl transition-all duration-300 active:scale-95`}
                                    >
                                        <div className="relative z-10 flex flex-col items-center gap-1">
                                            <span className="text-green-400 font-black text-xl md:text-2xl tracking-tight">YES</span>
                                            <span className="text-white font-mono text-xs md:text-sm group-hover:scale-110 transition-transform bg-green-500/20 px-2 py-0.5 rounded">{yesPrice}¢</span>
                                        </div>
                                        <div className="absolute inset-0 bg-green-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>

                                    <button
                                        disabled={isExpired}
                                        onClick={(e) => { e.stopPropagation(); connected ? setBetMode('no') : alert('Connect Wallet!'); }}
                                        className={`group relative overflow-hidden p-4 md:p-6 bg-red-500/10 ${isExpired ? 'cursor-not-allowed opacity-40' : 'hover:bg-red-500/20 border-red-500/20 hover:border-red-500/50'} rounded-2xl transition-all duration-300 active:scale-95`}
                                    >
                                        <div className="relative z-10 flex flex-col items-center gap-1">
                                            <span className="text-red-400 font-black text-xl md:text-2xl tracking-tight">NO</span>
                                            <span className="text-white font-mono text-xs md:text-sm group-hover:scale-110 transition-transform bg-red-500/20 px-2 py-0.5 rounded">{noPrice}¢</span>
                                        </div>
                                        <div className="absolute inset-0 bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 md:pt-6 border-t border-white/5 text-center">
                            <button
                                onClick={onOpenCreateModal} // Use the specific prop
                                className="text-gray-400 hover:text-white text-[10px] md:text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2 group"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-purple-500 transition-colors" />
                                Create Your Own Market
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
