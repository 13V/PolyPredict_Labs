'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Wallet, ArrowRight, History, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAllVotes, Vote, clearAllVotes } from '@/utils/voteStorage';

interface UserPositionsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserPositions = ({ isOpen, onClose }: UserPositionsProps) => {
    const { publicKey, connected } = useWallet();
    const [votes, setVotes] = useState<Vote[]>([]);

    useEffect(() => {
        if (isOpen && connected && publicKey) {
            const allVotes = getAllVotes();
            const myVotes = allVotes.filter(v => v.walletAddress === publicKey.toString());
            // Sort by newest first
            myVotes.sort((a, b) => b.timestamp - a.timestamp);
            setVotes(myVotes);
        }
    }, [isOpen, connected, publicKey]);

    const activePositions = votes; // In a real app, we'd filter by market status

    const totalStaked = activePositions.reduce((sum, v) => sum + (v.amount || 0), 0);
    const potentialWinnings = activePositions.reduce((sum, v) => sum + ((v.amount || 0) * 1.85), 0); // Mock 1.85x return

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-white/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 w-full md:max-w-md bg-white border-l-2 border-black shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-black text-white p-6 border-b-2 border-black flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Wallet className="text-orange-500 w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic leading-none">INTEL_PORTFOLIO_V1.1</span>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white hover:text-black transition-colors">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Identification Info */}
                        <div className="px-6 py-4 bg-gray-50 border-b-2 border-dashed border-black/10">
                            <p className="text-[10px] uppercase font-black text-black/40 mb-1 leading-none">CONNECTED_SIGNAL</p>
                            <p className="text-xs font-mono font-bold text-black truncate">{publicKey?.toString() || 'NO_SIGNAL_DETECTED'}</p>
                        </div>

                        {/* Stats Summary */}
                        <div className="p-6 grid grid-cols-2 gap-0 border-b-2 border-black bg-black">
                            <div className="bg-white p-6 border-r-2 border-black flex flex-col items-center">
                                <div className="text-[10px] text-black/40 font-black uppercase tracking-widest mb-2 leading-none text-center">TOTAL_STAKED</div>
                                <div className="text-2xl font-black text-black tracking-tighter italic">${totalStaked.toLocaleString()}</div>
                            </div>
                            <div className="bg-white p-6 flex flex-col items-center">
                                <div className="text-[10px] text-black/40 font-black uppercase tracking-widest mb-2 leading-none text-center">POTENTIAL_RETURN</div>
                                <div className="text-2xl font-black text-orange-600 tracking-tighter italic">${potentialWinnings.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Ranks & Progress */}
                        <div className="p-6 bg-gray-50/50 border-b-2 border-black">
                            {(() => {
                                const xp = totalStaked;
                                const ranks = [
                                    { name: 'NOVICE', threshold: 0, color: 'text-black' },
                                    { name: 'APPRENTICE', threshold: 1000, color: 'text-black' },
                                    { name: 'STRATEGIST', threshold: 5000, color: 'text-orange-600' },
                                    { name: 'ORACLE', threshold: 10000, color: 'text-orange-600' },
                                    { name: 'WHALE', threshold: 50000, color: 'text-orange-600' }
                                ];
                                const currentRankIndex = ranks.slice().reverse().findIndex(r => xp >= r.threshold);
                                const rankIndex = currentRankIndex === -1 ? 0 : ranks.length - 1 - currentRankIndex;
                                const currentRank = ranks[rankIndex];
                                const nextRank = ranks[rankIndex + 1];

                                let progress = 100;
                                if (nextRank) {
                                    const range = nextRank.threshold - currentRank.threshold;
                                    const current = xp - currentRank.threshold;
                                    progress = Math.min(100, Math.max(0, (current / range) * 100));
                                }

                                return (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] uppercase font-black text-black/40 tracking-widest mb-1 leading-none">CURRENT_RANK</div>
                                                <div className={`text-4xl font-black tracking-tighter italic leading-none ${currentRank.color}`}>{currentRank.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase font-black text-black/40 tracking-widest mb-1 leading-none">
                                                    {nextRank ? `NEXT: ${nextRank.name}` : 'MAX_LEVEL'}
                                                </div>
                                                <div className="text-[10px] font-black text-black leading-none">
                                                    {nextRank
                                                        ? `${Math.floor(nextRank.threshold - xp).toLocaleString()} FUEL_TO_UPGRADE`
                                                        : 'LEGENDARY_STATUS_CONFIRMED'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-6 bg-white border-2 border-black relative overflow-hidden">
                                            <motion.div
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '0%' }}
                                                style={{ right: `${100 - progress}%` }}
                                                transition={{ duration: 1, ease: "circOut" }}
                                                className="absolute inset-y-0 left-0 bg-black"
                                            />
                                            {/* Static Grid lines for the progress bar */}
                                            <div className="absolute inset-0 flex">
                                                {[...Array(10)].map((_, i) => (
                                                    <div key={i} className="flex-1 border-r border-black/10 last:border-r-0" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Positions List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                            <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-2 sticky top-0 bg-white/90 backdrop-blur-md py-2 z-10 italic">
                                <History size={14} strokeWidth={3} className="text-orange-600" /> RECENT_INTELLIGENCE_ACTIVITY
                            </h3>

                            {votes.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-black/10 flex flex-col items-center gap-6">
                                    <TrendingUp size={32} className="text-black/10" strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-black/40">No activity detected on sub-network.</p>
                                    <button onClick={onClose} className="neo-button bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest italic hover:bg-orange-600 transition-colors">Start Integration</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {votes.map((vote, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white border-2 border-black p-5 hover:bg-gray-50 transition-colors group relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase border border-black ${vote.choice === 'yes' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
                                                        {vote.choice}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold text-black/40">SIG_{vote.predictionId}</span>
                                                </div>
                                                <span className="text-[8px] font-black text-black/40 uppercase tracking-widest">
                                                    {new Date(vote.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="text-[8px] font-black text-black/40 uppercase tracking-widest block mb-1">STAKED_FUEL</span>
                                                    <span className="font-mono text-xl font-bold text-black tracking-tighter">${(vote.amount || 0).toLocaleString()}</span>
                                                </div>
                                                <ArrowRight size={18} className="text-orange-600 mb-1" strokeWidth={3} />
                                                <div className="text-right">
                                                    <span className="text-[8px] font-black text-black/40 uppercase tracking-widest block mb-1">PROJ_RETURN</span>
                                                    <span className="font-mono text-xl font-bold text-black tracking-tighter">+${((vote.amount || 0) * 1.85).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Hover decoration */}
                                            <div className="absolute right-0 bottom-0 w-2 h-2 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t-2 border-black bg-gray-50">
                            <button
                                onClick={() => {
                                    if (confirm('Irreversible Action: Terminate all protocol history?')) {
                                        clearAllVotes();
                                        setVotes([]);
                                    }
                                }}
                                className="w-full py-4 border-2 border-black text-black/40 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all flex items-center justify-center gap-3 italic"
                            >
                                <Trash2 size={16} strokeWidth={3} /> Clear_Signal_History
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
