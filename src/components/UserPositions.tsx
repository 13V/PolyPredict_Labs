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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full md:max-w-md bg-[#0f172a] border-l border-gray-800 shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Wallet className="text-purple-500" size={24} />
                                    My Positions
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">Track your active bets and history.</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stats Summary */}
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Staked</div>
                                <div className="text-2xl font-mono font-bold text-white">${totalStaked.toLocaleString()}</div>
                            </div>
                            <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/20">
                                <div className="text-xs text-purple-300 uppercase tracking-wider mb-1">Potential Win</div>
                                <div className="text-2xl font-mono font-bold text-purple-400">${potentialWinnings.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Positions List */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6">
                            <h3 className="text-sm font-bold text-gray-400 mb-4 sticky top-0 bg-[#0f172a] py-2 z-10 flex items-center gap-2">
                                <History size={14} /> RECENT ACTIVITY
                            </h3>

                            {votes.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                        <TrendingUp size={24} className="opacity-50" />
                                    </div>
                                    <p>No active bets found.</p>
                                    <button onClick={onClose} className="text-purple-400 hover:underline text-sm">Start Trading</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {votes.map((vote, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${vote.choice === 'yes' ? 'bg-green-900/30 text-green-400 border border-green-500/20' : 'bg-red-900/30 text-red-400 border border-red-500/20'
                                                        }`}>
                                                        {vote.choice}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-mono">#{vote.predictionId}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(vote.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center mt-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500">Staked</span>
                                                    <span className="font-mono font-bold text-white">${(vote.amount || 0).toLocaleString()}</span>
                                                </div>
                                                <ArrowRight size={14} className="text-gray-600" />
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-gray-500">Potential</span>
                                                    <span className="font-mono font-bold text-green-400">+${((vote.amount || 0) * 1.85).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-800 bg-gray-900/30">
                            <button
                                onClick={() => {
                                    if (confirm('Clear all local history?')) {
                                        clearAllVotes();
                                        setVotes([]);
                                    }
                                }}
                                className="w-full py-3 rounded-lg border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> Reset History
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
