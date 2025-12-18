'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Clock, Trophy, ChevronRight, BarChart3 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { saveVote, getVote } from '@/utils/voteStorage';
import { getDeterministicPattern } from '@/utils/chartPatterns';
import { Sparkline } from './Sparkline';
import { useToast } from '@/context/ToastContext';
import { useHaptic } from '@/hooks/useHaptic';

interface PredictionCardProps {
    id: number;
    category: string;
    question: string;
    endTime: number;
    outcomes: string[];
    totals: number[];
    totalLiquidity: number;
    resolved: boolean;
    winningOutcome?: number;
    polymarketId?: string;
    isHot?: boolean;
}

export const PredictionCard = ({
    id,
    category,
    question,
    endTime,
    outcomes,
    totals,
    totalLiquidity,
    resolved,
    winningOutcome,
    polymarketId,
    isHot
}: PredictionCardProps) => {
    const { publicKey, connected } = useWallet();
    const toast = useToast();
    const { trigger: haptic } = useHaptic();

    const [votedIndex, setVotedIndex] = useState<number | null>(null);
    const [betMode, setBetMode] = useState<number | null>(null);
    const [stakeAmount, setStakeAmount] = useState('');
    const [showAllOutcomes, setShowAllOutcomes] = useState(false);

    // Derived data
    const totalVotes = totals.reduce((a, b) => a + b, 0);
    const outcomeProbabilities = totals.map(t => totalVotes > 0 ? (t / totalVotes) * 100 : 100 / outcomes.length);

    // Sort outcomes by probability for the preview
    const sortedIndices = outcomes.map((_, i) => i).sort((a, b) => outcomes[b] ? (totals[b] - totals[a]) : 0);
    const topOutcomes = showAllOutcomes ? sortedIndices : sortedIndices.slice(0, 2);

    useEffect(() => {
        if (publicKey) {
            const existingVote = getVote(id, publicKey.toString());
            if (existingVote && existingVote.outcomeIndex !== undefined) {
                setVotedIndex(existingVote.outcomeIndex);
            }
        }
    }, [publicKey, id]);

    const handleOutcomeClick = (index: number) => {
        haptic('selection');
        if (!connected || !publicKey) {
            toast.error('Connect wallet to place a bet');
            return;
        }
        if (resolved) return;
        setBetMode(index);
    };

    const confirmBet = () => {
        if (betMode === null || !connected) return;

        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Enter a valid amount");
            return;
        }

        haptic('success');
        // In V2, we'll call the actual Solana program here. 
        // For now, we update local state to show the "voted" UI.
        saveVote({
            predictionId: id,
            choice: 'multi',
            outcomeIndex: betMode,
            walletAddress: publicKey!.toString(),
            timestamp: Date.now(),
            amount: amount
        }, { publicKey, signTransaction: undefined, sendTransaction: undefined });

        setVotedIndex(betMode);
        setBetMode(null);
        toast.success(`Bet placed on ${outcomes[betMode]}`);
    };

    const timeLeft = () => {
        const diff = endTime * 1000 - Date.now();
        if (diff <= 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <motion.div
            layout
            className={`glass glass-hover rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 relative overflow-hidden group ${isHot ? 'border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : ''
                }`}
        >
            {/* Header */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{category}</span>
                        {isHot && <span className="text-[10px] font-bold text-orange-500 animate-pulse">🔥 HOT</span>}
                    </div>
                    <h3 className="font-outfit font-bold text-lg leading-tight text-slate-100 group-hover:text-white transition-colors">
                        {question}
                    </h3>
                </div>
                <div className="shrink-0 w-12 h-6 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={getDeterministicPattern(id, outcomeProbabilities[0])} width={48} height={24} color="#a855f7" />
                </div>
            </div>

            {/* Info Bar */}
            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
                <div className="flex items-center gap-1">
                    <Clock size={12} className="text-purple-500" />
                    <span>{timeLeft()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <BarChart3 size={12} className="text-blue-500" />
                    <span>${totalLiquidity.toLocaleString()} Vol</span>
                </div>
            </div>

            {/* Outcomes */}
            <div className="flex flex-col gap-2 relative">
                <AnimatePresence mode="popLayout">
                    {topOutcomes.map((idx) => (
                        <motion.button
                            key={idx}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            onClick={() => handleOutcomeClick(idx)}
                            className={`w-full group/btn relative h-12 rounded-xl border transition-all flex items-center justify-between px-4 overflow-hidden ${votedIndex === idx
                                ? 'bg-purple-500/20 border-purple-500/50'
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                                } ${resolved && winningOutcome !== idx ? 'opacity-40' : ''}`}
                        >
                            {/* Progress Bar Background */}
                            <div
                                className={`absolute inset-0 opacity-10 transition-all ${votedIndex === idx ? 'bg-purple-500' : 'bg-slate-400'}`}
                                style={{ width: `${outcomeProbabilities[idx]}%` }}
                            />

                            <div className="relative z-10 flex items-center gap-2">
                                {resolved && winningOutcome === idx && <Trophy size={14} className="text-amber-400" />}
                                <span className={`text-sm font-bold ${votedIndex === idx ? 'text-purple-400' : 'text-slate-200'}`}>
                                    {outcomes[idx]}
                                </span>
                            </div>

                            <div className="relative z-10 flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-slate-400">
                                    {outcomeProbabilities[idx].toFixed(0)}%
                                </span>
                                <ChevronRight size={14} className="text-slate-600 group-hover/btn:translate-x-1 transition-transform" />
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>

                {outcomes.length > 2 && (
                    <button
                        onClick={() => setShowAllOutcomes(!showAllOutcomes)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors py-1 self-center"
                    >
                        {showAllOutcomes ? 'Show Less' : `+ ${outcomes.length - 2} More Outcomes`}
                    </button>
                )}
            </div>

            {/* Bet Modal Overlay */}
            <AnimatePresence>
                {betMode !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-0 bottom-0 bg-slate-900 border-t border-white/10 p-5 flex flex-col gap-4 z-20 shadow-2xl"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase">Stake on {outcomes[betMode]}</span>
                            <button onClick={() => setBetMode(null)} className="text-slate-500 hover:text-white">✕</button>
                        </div>
                        <div className="relative">
                            <input
                                autoFocus
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 font-mono font-bold text-xl focus:border-purple-500 focus:outline-none transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">$PROPHET</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {['100', '500', '1k', '5k'].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setStakeAmount(val.replace('k', '000'))}
                                    className="h-8 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-400 transition-colors"
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={confirmBet}
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
                        >
                            Confirm Prediction
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer / Status */}
            {resolved && (
                <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Resolved</span>
                    <button className="text-[10px] font-bold text-green-400 hover:underline">Claim Winnings</button>
                </div>
            )}
        </motion.div>
    );
};
