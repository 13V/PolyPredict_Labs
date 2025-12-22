'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, Zap, BarChart3, TrendingUp, Award, Shield } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { getAllVotes } from '@/utils/voteStorage';
import { useMemo } from 'react';

interface TraderDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress?: string;
}

export const TraderDashboard = ({ isOpen, onClose, walletAddress }: TraderDashboardProps) => {
    const userStats = useMemo(() => {
        const allVotes = getAllVotes();
        const userVotes = allVotes.filter(v => v.walletAddress === walletAddress);
        const totalPositions = new Set(userVotes.map(v => v.predictionId)).size;

        // Mocking profit/win-rate for now as we need resolution data mapping
        // But making the position count real
        return [
            { label: 'GROSS_PROFIT', value: '+0.00 $PREDICT', color: 'text-orange-600', icon: TrendingUp },
            { label: 'WIN_PROBABILITY', value: '0%', color: 'text-black', icon: Target },
            { label: 'TOTAL_POSITIONS', value: totalPositions.toString(), color: 'text-black', icon: BarChart3 },
            { label: 'RANK_INDEX', value: totalPositions > 0 ? '#492' : 'N/A', color: 'text-orange-600', icon: Trophy },
        ];
    }, [walletAddress]);

    const badges = [
        { name: 'EARLY_ADOPTER_V1', icon: Zap, description: 'Protocol Genesis Participant', unlocked: true },
        { name: 'WHALE_FOLLOW_SYNC', icon: Target, description: 'Synchronized with large-scale market move', unlocked: true },
        { name: 'STABILITY_AUTH', icon: Shield, description: 'Consistency coefficient maintained at 5.0', unlocked: false },
        { name: 'GRANDMASTER_SIGNAL', icon: Award, description: 'Resolution accuracy exceeds 100 markets', unlocked: false },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                >
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" onClick={onClose} />

                    <motion.div
                        initial={{ scale: 0.98, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 10 }}
                        className="relative w-full max-w-6xl bg-white border-2 border-black overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]"
                    >
                        <div className="bg-black text-white p-4 flex items-center justify-between border-b-2 border-black relative">
                            {/* Signal Sidebar */}
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-orange-600" />
                            <div className="flex items-center gap-4 pl-2">
                                <TrendingUp className="w-5 h-5 text-orange-500" />
                                <span className="text-[10px] font-black font-mono uppercase tracking-[0.3em] italic">TRADER_TERMINAL_V4.0 // {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="hidden md:flex items-center gap-4 text-[10px] font-bold">
                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" /> SYSTEM_ONLINE</span>
                                    <span className="opacity-40">LATENCY: 12ms</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-white hover:text-black transition-colors"
                                >
                                    <X size={18} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Profile Summary */}
                        <div className="p-8 md:p-12 border-b-2 border-black relative bg-gray-50/50">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest italic">VERIFIED_TRADER</span>
                                        <div className="h-[1px] w-12 bg-black/10" />
                                    </div>
                                    <h1 className="text-4xl md:text-6xl font-black text-black mb-2 tracking-tighter uppercase italic leading-none">Intelligence<br />Dashboard</h1>
                                    <p className="text-black/40 font-mono text-xs tracking-widest mt-4 uppercase">Identity Signal: {walletAddress || 'Disconnected'}</p>
                                </div>
                                <div className="flex gap-0 border-2 border-black overflow-hidden">
                                    <div className="bg-white border-r-2 border-black px-8 py-6 flex flex-col items-center min-w-[140px]">
                                        <span className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-1 leading-none">XP_LVL</span>
                                        <span className="text-4xl font-black text-black tracking-tighter italic">42</span>
                                    </div>
                                    <div className="bg-black text-white px-8 py-6 flex flex-col items-center min-w-[140px]">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 leading-none">REP_SCORE</span>
                                        <span className="text-4xl font-black text-orange-500 tracking-tighter italic">880</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 scrollbar-hide bg-white">

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-black bg-black">
                                {userStats.map((stat, i) => (
                                    <div key={i} className="bg-white p-8 border-black group hover:bg-black hover:text-white transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <stat.icon className={`w-6 h-6 ${stat.color === 'text-orange-600' ? 'text-orange-600 group-hover:text-white' : 'text-black/20 group-hover:text-white'} transition-colors`} />
                                            <span className="text-[10px] font-mono font-black opacity-20">STAT_{i + 1}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-black/40 group-hover:text-white/40 uppercase tracking-widest mb-2 leading-none">{stat.label}</p>
                                        <p className={`text-2xl font-black italic tracking-tighter leading-none font-mono ${stat.color === 'text-orange-600' ? 'text-orange-600 group-hover:text-white' : ''}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid lg:grid-cols-3 gap-0 border-2 border-black overflow-hidden">
                                {/* Performance Visualizer */}
                                <div className="lg:col-span-2 p-10 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-8 bg-gray-50/30">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3 italic">
                                            <div className="w-2 h-2 bg-orange-600" />
                                            Equity_Performance_Chart
                                        </h3>
                                        <div className="flex border-2 border-black overflow-hidden">
                                            {['7D', '30D', 'MAX'].map(t => (
                                                <button key={t} className="px-3 py-1 text-[10px] font-black bg-white hover:bg-black hover:text-white border-r-2 last:border-r-0 border-black transition-colors uppercase italic">
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-64 relative group border-2 border-dashed border-black/10 p-4">
                                        <Sparkline data={[10, 25, 15, 40, 35, 60, 55, 80, 75, 95]} width={1000} height={200} color="#EA580C" />
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
                                    </div>
                                </div>

                                {/* Achievement Modules */}
                                <div className="p-8 space-y-8 bg-white">
                                    <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3 italic">
                                        <div className="w-2 h-2 bg-black" />
                                        Protocol_Merits
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {badges.map((badge, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center gap-4 p-4 border-2 transition-all ${badge.unlocked
                                                    ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(234,88,12,0.5)]'
                                                    : 'bg-white text-black/20 border-black/10'
                                                    }`}
                                            >
                                                <div className={`p-3 border-2 ${badge.unlocked ? 'bg-orange-600 border-white text-white' : 'bg-gray-50 border-black/5 text-black/10'}`}>
                                                    <badge.icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase italic tracking-tighter leading-none mb-1">{badge.name}</p>
                                                    <p className="text-[10px] uppercase font-bold opacity-60 leading-none">{badge.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terminal Footer */}
                        <div className="p-4 bg-gray-50 border-t-2 border-black flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 bg-black uppercase" /> SYSTEM_ENCRYPTED_SSL</span>
                            <span className="text-black/40 italic">PolyPredict Intelligence Interface v4.0.2</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
