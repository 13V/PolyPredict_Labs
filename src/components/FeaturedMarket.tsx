'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Clock, ArrowUpRight, Activity } from 'lucide-react';
import { Sparkline } from './Sparkline';

import { useState } from 'react';
import { saveVote } from '@/utils/voteStorage';
import { useWallet } from '@solana/wallet-adapter-react';

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
}

export const FeaturedMarket = ({ data, onOpenCreateModal }: FeaturedMarketProps) => {
    const { publicKey, connected } = useWallet();
    const [betMode, setBetMode] = useState<'yes' | 'no' | null>(null);
    const [stakeAmount, setStakeAmount] = useState('');
    // Determine Yes % (default 85 if no data)
    const yesPercentage = data ? ((data.yesVotes / (data.yesVotes + data.noVotes)) * 100) : 85;
    const yesPrice = Math.floor(yesPercentage);
    const noPrice = 100 - yesPrice;

    // Mock data for the big chart (still mock for now as we don't fetch historicals for hero yet)
    const bigChartData = [45, 48, 47, 52, 55, 58, 54, 59, 62, 65, 63, 68, 72, 75, 74, 80, 82, 85];

    return (
        <div className="relative group rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-gray-950">
            {/* Cinematic Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900/0 to-gray-950/0" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

            {/* Animated Grid Texture Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

            <div className="relative grid lg:grid-cols-5 gap-0 min-h-[480px]">
                {/* Left: Chart & Info (3 cols) */}
                <div className="lg:col-span-3 p-6 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 relative">

                    {/* Floating Badge */}
                    <div className="absolute top-10 right-10 flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            LIVE
                        </div>
                    </div>

                    <div className="z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold px-3 py-1 rounded-sm flex items-center gap-2 tracking-wider">
                                <TrendingUp size={12} /> #1 TRENDING
                            </span>
                            <span className="text-gray-500 text-sm font-mono tracking-wide uppercase">
                                {data?.category || 'Politics'} • Ends {data?.timeLeft || 'Today'}
                            </span>
                        </div>

                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            {data?.question || "Will Bitcoin close higher today?"}
                        </h2>

                        <div className="flex flex-wrap items-center gap-8 mt-4 text-sm text-gray-400 font-mono">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                    <Activity size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 uppercase">Volume</span>
                                    <span className="text-white font-bold">${data?.totalVolume ? data.totalVolume.toLocaleString() : '4.2m'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <Users size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 uppercase">Traders</span>
                                    <span className="text-white font-bold">12.5k</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Big Chart Area */}
                    <div className="mt-12">
                        <div className="flex items-end gap-4 mb-4">
                            <div className="text-6xl font-black text-white tracking-tighter">{yesPrice}%</div>
                            <div className="text-green-400 font-mono text-lg mb-2 flex items-center">
                                <ArrowUpRight size={20} />
                                +{(data?.question.length ? (data.question.length % 15) + 1.5 : 12.4).toFixed(1)}% today
                            </div>
                        </div>

                        {/* Seamless Chart Container */}
                        <div className="h-[80px] md:h-[120px] w-full relative overflow-hidden mask-linear-fade">
                            <Sparkline data={bigChartData} width={800} height={120} color="#a855f7" />
                            {/* Gradient Overlay for Fade */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Right: Trading Interface (2 cols) */}
                <div className="lg:col-span-2 p-6 md:p-10 bg-white/[0.02] backdrop-blur-md flex flex-col justify-center gap-8 relative overflow-hidden">
                    {/* Glass Reflection */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="space-y-6 z-10">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest">
                                <span>Order Book</span>
                                <span>Spread: 1¢</span>
                            </div>
                            {/* Mock Order Book Visual */}
                            <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-gray-800">
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
                                <div className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className={`text-xl font-black uppercase tracking-tight ${betMode === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                                            Bet on {betMode === 'yes' ? 'YES' : 'NO'}
                                        </h3>
                                        <button onClick={() => setBetMode(null)} className="text-gray-500 hover:text-white">✕</button>
                                    </div>

                                    <div className="relative mb-4">
                                        <input
                                            type="number"
                                            placeholder="Enter Amount"
                                            value={stakeAmount}
                                            onChange={(e) => setStakeAmount(e.target.value)}
                                            className="w-full bg-black/40 border-2 border-gray-600 focus:border-purple-500 rounded-xl px-4 py-3 text-lg text-white placeholder-gray-600 outline-none transition-all"
                                            autoFocus
                                        />
                                        <span className="absolute right-4 top-4 text-sm font-bold text-gray-400">$PROPHET</span>
                                    </div>

                                    <button
                                        onClick={handleConfirmBet}
                                        className={`w-full py-4 rounded-xl text-lg font-black uppercase tracking-widest text-white shadow-xl transition-transform active:scale-95 ${betMode === 'yes' ? 'bg-gradient-to-r from-green-600 to-green-500 hover:to-green-400 shadow-green-900/20' : 'bg-gradient-to-r from-red-600 to-red-500 hover:to-red-400 shadow-red-900/20'
                                            }`}
                                    >
                                        CONFIRM BET
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => connected ? setBetMode('yes') : alert('Connect Wallet!')}
                                        className="group relative overflow-hidden p-6 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/50 rounded-2xl transition-all duration-300 active:scale-95"
                                    >
                                        <div className="relative z-10 flex flex-col items-center gap-1">
                                            <span className="text-green-400 font-black text-2xl tracking-tight">YES</span>
                                            <span className="text-white font-mono text-sm group-hover:scale-110 transition-transform bg-green-500/20 px-2 py-0.5 rounded">{yesPrice}¢</span>
                                        </div>
                                        <div className="absolute inset-0 bg-green-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>

                                    <button
                                        onClick={() => connected ? setBetMode('no') : alert('Connect Wallet!')}
                                        className="group relative overflow-hidden p-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50 rounded-2xl transition-all duration-300 active:scale-95"
                                    >
                                        <div className="relative z-10 flex flex-col items-center gap-1">
                                            <span className="text-red-400 font-black text-2xl tracking-tight">NO</span>
                                            <span className="text-white font-mono text-sm group-hover:scale-110 transition-transform bg-red-500/20 px-2 py-0.5 rounded">{noPrice}¢</span>
                                        </div>
                                        <div className="absolute inset-0 bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-white/5 text-center">
                            <button
                                onClick={onOpenCreateModal} // Use the specific prop
                                className="text-gray-400 hover:text-white text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2 group"
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
