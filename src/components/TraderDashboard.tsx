'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, Zap, BarChart3, TrendingUp, Award, Shield } from 'lucide-react';
import { Sparkline } from './Sparkline';

interface TraderDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress?: string;
}

export const TraderDashboard = ({ isOpen, onClose, walletAddress }: TraderDashboardProps) => {
    // Mock Data - In a real app, we'd calculate this from voteHistory
    const stats = [
        { label: 'Total PnL', value: '+12,450 $POLYBET', color: 'text-green-400', icon: TrendingUp },
        { label: 'Win Rate', value: '68%', color: 'text-purple-400', icon: Target },
        { label: 'Total Bets', value: '42', color: 'text-blue-400', icon: BarChart3 },
        { label: 'Rank', value: '#124', color: 'text-orange-400', icon: Trophy },
    ];

    const badges = [
        { name: 'Early Poly', icon: Zap, description: 'One of the first 1000 users', unlocked: true },
        { name: 'Whale Hunter', icon: Target, description: 'Followed a whale move correctly', unlocked: true },
        { name: 'Steady Hand', icon: Shield, description: 'Longest winning streak: 5', unlocked: false },
        { name: 'Grandmaster', icon: Award, description: 'Win 100+ markets', unlocked: false },
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
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={onClose} />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full max-w-5xl bg-gray-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
                    >
                        {/* Header Area */}
                        <div className="p-8 md:p-12 border-b border-white/5 relative">
                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                                <div>
                                    <h1 className="text-4xl font-black text-white mb-2">TRADER DASHBOARD</h1>
                                    <p className="text-gray-500 font-mono text-xs tracking-widest">{walletAddress || '0xConnect...Wallet'}</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-purple-500/10 border border-purple-500/20 px-6 py-4 rounded-2xl flex flex-col items-center">
                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">XP Level</span>
                                        <span className="text-2xl font-black text-white">42</span>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 px-6 py-4 rounded-2xl flex flex-col items-center">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Reputation</span>
                                        <span className="text-2xl font-black text-white">880</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 scrollbar-hide">

                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {stats.map((stat, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <stat.icon className={`mb-4 ${stat.color.replace('text-', 'text-opacity-40 text-')}`} size={24} />
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className={`text-xl md:text-2xl font-black ${stat.color}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-3 gap-12">
                                {/* Performance Chart (Left 2 cols) */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Performance History</h3>
                                        <div className="flex gap-2">
                                            {['7D', '30D', 'ALL'].map(t => (
                                                <button key={t} className="px-3 py-1 text-[10px] font-bold rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-64 bg-white/5 rounded-3xl p-8 border border-white/5 relative group">
                                        <Sparkline data={[10, 25, 15, 40, 35, 60, 55, 80, 75, 95]} width={1000} height={200} color="#a855f7" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />
                                    </div>
                                </div>

                                {/* Achievements (Right 1 col) */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Achievements</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {badges.map((badge, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${badge.unlocked
                                                    ? 'bg-purple-500/10 border-purple-500/30'
                                                    : 'bg-white/5 border-white/5 opacity-40 grayscale'
                                                    }`}
                                            >
                                                <div className={`p-3 rounded-xl ${badge.unlocked ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-600'}`}>
                                                    <badge.icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white leading-tight">{badge.name}</p>
                                                    <p className="text-[10px] text-gray-500">{badge.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
