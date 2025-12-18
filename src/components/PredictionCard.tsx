'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Clock, Trophy, ChevronRight, BarChart3, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { saveVote, getVote } from '@/utils/voteStorage';
import { getDeterministicPattern } from '@/utils/chartPatterns';
import { Sparkline } from './Sparkline';
import { useToast } from '@/context/ToastContext';
import { useHaptic } from '@/hooks/useHaptic';
import { getPythPrices } from '@/services/pyth';
import { getCoinGeckoSparkline } from '@/services/coingecko';

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
    slug?: string;
    eventTitle?: string;
    onOpenExpanded?: () => void;
    onSettle?: (id: number) => void;
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
    isHot,
    slug,
    eventTitle,
    onOpenExpanded,
    onSettle
}: PredictionCardProps) => {
    const { publicKey, connected } = useWallet();
    const toast = useToast();
    const { trigger: haptic } = useHaptic();

    const [votedIndex, setVotedIndex] = useState<number | null>(null);
    const [betMode, setBetMode] = useState<number | null>(null);
    const [stakeAmount, setStakeAmount] = useState('');
    const [showAllOutcomes, setShowAllOutcomes] = useState(false);
    const [pythData, setPythData] = useState<number[] | null>(null);
    const [pythPrice, setPythPrice] = useState<number | null>(null);

    // Extraction Logic for "Up/Down" markets
    // Priority: Question -> Slug -> EventTitle
    const findTarget = () => {
        const fullSource = `${question} ${slug || ''} ${eventTitle || ''}`.toLowerCase();

        // 1. Check for standard money format ($96,000)
        const matchMoney = fullSource.match(/\$(\d{1,3}(,\d{3})*(\.\d+)?)/);
        if (matchMoney) return matchMoney[0];

        // 2. Check for "at" followed by price (price at 96000)
        const matchAt = fullSource.match(/at\s+(\d{2,3}k|\d{4,})/);
        if (matchAt) return `$${matchAt[1]}`;

        // 3. Fallback to any large numbers or "k" shorthand
        const matchK = fullSource.match(/(\d{2,3}k)|(\d{5,})/i);
        if (matchK) return `$${matchK[0]}`;

        return null;
    };

    const priceTarget = findTarget();

    // UNIVERSAL PROBE: Log all props once per ID to see what Polymarket is sending
    useEffect(() => {
        console.log(
            `%c[PROBE ${id}] %c${question}`,
            'background: #333; color: #fff; font-weight: bold; padding: 2px 5px;',
            'color: #999;',
            { category, slug, eventTitle, outcomes, polymarketId }
        );
    }, [id, question, category, slug, eventTitle, outcomes, polymarketId]);

    const isCrypto = category.toLowerCase().includes('crypto') ||
        question.toLowerCase().match(/bitcoin|btc|ethereum|eth|solana|sol|price/i) ||
        slug?.toLowerCase().match(/bitcoin|btc|ethereum|eth|solana|sol|price/i);

    useEffect(() => {
        if (isCrypto) {
            console.log(
                `%c[Card ${id}] Init: "${question}" | Target: ${priceTarget}`,
                'background: #7c3aed; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
            );
        }
    }, [isCrypto, question, priceTarget, id]);

    // Lifecycle Logic
    const isExpired = Date.now() > endTime * 1000;

    // Derived Data for Pyth
    useEffect(() => {
        if (isCrypto) {
            const q = `${question} ${slug || ''} ${eventTitle || ''}`.toLowerCase();
            let symbol = '';
            if (q.includes('bitcoin') || q.includes('btc')) symbol = 'BTC';
            else if (q.includes('ethereum') || q.includes('eth')) symbol = 'ETH';
            else if (q.includes('solana') || q.includes('sol')) symbol = 'SOL';

            if (symbol) {
                // Initial Fetch: Sparkline (once) and Price
                const initFetch = async () => {
                    try {
                        const [sparkline, prices] = await Promise.all([
                            getCoinGeckoSparkline(symbol),
                            getPythPrices([symbol])
                        ]);
                        if (sparkline.length > 0) setPythData(sparkline);
                        if (prices[symbol]) setPythPrice(prices[symbol]);
                    } catch (e) {
                        console.error('Initial pricing fetch error:', e);
                    }
                };

                // Polling: Only Price (every 15s)
                const pollPrice = async () => {
                    try {
                        const prices = await getPythPrices([symbol]);
                        if (prices[symbol]) setPythPrice(prices[symbol]);
                    } catch (e) {
                        console.error('Pyth polling error:', e);
                    }
                };

                initFetch();
                const interval = setInterval(pollPrice, 15000);
                return () => clearInterval(interval);
            }
        }
    }, [category, question]);

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

    const theme = getCategoryTheme(category);

    useEffect(() => {
        if (publicKey) {
            const existingVote = getVote(id, publicKey.toString());
            if (existingVote && existingVote.outcomeIndex !== undefined) {
                setVotedIndex(existingVote.outcomeIndex);
            }
        }
    }, [publicKey, id]);

    // Automatic Settlement Timer
    useEffect(() => {
        if (resolved) return;

        const checkSettlement = () => {
            if (Date.now() >= endTime * 1000) {
                onSettle?.(id);
            }
        };

        // Check immediately
        checkSettlement();

        // Set interval to check every second for precision
        const interval = setInterval(checkSettlement, 1000);
        return () => clearInterval(interval);
    }, [endTime, id, resolved, onSettle]);

    const handleOutcomeClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (isExpired || resolved) {
            toast.error('This market is closed');
            return;
        }

        haptic('selection');
        if (!connected || !publicKey) {
            toast.error('Connect wallet to place a bet');
            return;
        }
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

    // Derived data
    const totalVotes = totals.reduce((a, b) => a + b, 0);
    const outcomeProbabilities = totals.map(t => totalVotes > 0 ? (t / totalVotes) * 100 : 100 / outcomes.length);

    // Sort outcomes by probability for the preview
    const sortedIndices = outcomes.map((_, i) => i).sort((a, b) => outcomes[b] ? (totals[b] - totals[a]) : 0);
    const topOutcomes = showAllOutcomes ? sortedIndices : sortedIndices.slice(0, 2);

    return (
        <motion.div
            layout
            onClick={onOpenExpanded}
            className={`glass rounded-2xl p-5 flex flex-col gap-4 transition-all duration-500 relative overflow-hidden group border-white/5 hover:border-white/10 cursor-pointer ${isHot ? 'shadow-[0_0_20px_rgba(249,115,22,0.1)]' : ''
                } ${(isExpired && !resolved) ? 'grayscale opacity-80' : ''}`}
            style={{
                boxShadow: resolved ? 'none' : `0 0 30px ${theme.glow}`,
                borderBottom: resolved ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${theme.color}20`
            }}
        >
            {/* Market Closed Banner */}
            {isExpired && !resolved && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="rotate-[-10deg] bg-red-500/20 text-red-500 border border-red-500/50 px-8 py-2 font-black text-2xl tracking-[0.3em] backdrop-blur-sm shadow-2xl">
                        CLOSED
                    </div>
                </div>
            )}

            {/* Theme Flare */}
            {!resolved && (
                <div
                    className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40"
                    style={{ background: theme.color }}
                />
            )}

            {/* Header */}
            <div className="flex justify-between items-start gap-4 z-10">
                <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${resolved ? 'text-gray-500' : theme.text}`}>{category}</span>
                        {isHot && !resolved && <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                            HOT
                        </span>}
                        {resolved && <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            RESOLVED
                        </span>}
                    </div>
                    <h3 className={`font-outfit font-bold text-lg leading-tight transition-colors ${resolved ? 'text-gray-400' : 'text-white'}`}>
                        {question}
                    </h3>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="w-14 h-8 opacity-60 group-hover:opacity-100 transition-all duration-500">
                        <Sparkline
                            data={pythData || getDeterministicPattern(id, outcomeProbabilities[0])}
                            width={56}
                            height={32}
                            color={resolved ? '#4b5563' : theme.color}
                        />
                    </div>
                    {isCrypto && (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Live Price</span>
                            <span className="text-xs font-mono font-bold text-white flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded shadow-lg">
                                <span className={`w-1.5 h-1.5 rounded-full ${pythPrice ? 'bg-green-500 animate-pulse' : 'bg-gray-600'} shadow-[0_0_8px_rgba(34,197,94,0.3)]`} />
                                {pythPrice ? `$${pythPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Bar */}
            {!resolved && (
                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 tracking-wide z-10">
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className={isExpired ? 'text-red-500' : theme.text} />
                        <span className={isExpired ? 'text-red-500' : ''}>{timeLeft()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <BarChart3 size={12} className="text-blue-500" />
                        <span>${totalLiquidity.toLocaleString()} VOL</span>
                    </div>
                </div>
            )}

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
                            onClick={(e) => handleOutcomeClick(e, idx)}
                            disabled={isExpired || resolved}
                            className={`w-full group/btn relative h-12 rounded-xl border transition-all flex items-center justify-between px-4 overflow-hidden ${votedIndex === idx
                                ? 'bg-purple-500/20 border-purple-500/50'
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                                } ${resolved && winningOutcome !== idx ? 'opacity-40' : ''} ${isExpired && !resolved ? 'cursor-not-allowed' : ''}`}
                        >
                            <div className="absolute inset-0 bg-gray-900/40" />

                            {/* Probability Fill */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${outcomeProbabilities[idx]}%` }}
                                className="absolute inset-0 opacity-20"
                                style={{ background: resolved ? '#4b5563' : theme.color }}
                            />

                            <div className="relative z-10 flex justify-between items-center w-full">
                                <div className="flex items-center gap-2">
                                    {resolved && winningOutcome === idx && <Trophy size={14} className="text-amber-400" />}
                                    <span className={`text-sm font-bold ${votedIndex === idx ? 'text-purple-400' : 'text-slate-200'}`}>
                                        {outcomes[idx]}
                                        {priceTarget && (outcomes[idx].toLowerCase() === 'up' || outcomes[idx].toLowerCase() === 'down') && (
                                            <span className="ml-1 text-[10px] text-gray-500 font-normal">
                                                {outcomes[idx].toLowerCase() === 'up' ? '>' : '<'} {priceTarget}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-slate-400">
                                        {outcomeProbabilities[idx].toFixed(0)}%
                                    </span>
                                    {!isExpired && !resolved && <ChevronRight size={14} className="text-slate-600 group-hover/btn:translate-x-1 transition-transform" />}
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>

                {outcomes.length > 2 && !resolved && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowAllOutcomes(!showAllOutcomes); }}
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
                            <button onClick={(e) => { e.stopPropagation(); setBetMode(null); }} className="text-slate-500 hover:text-white">✕</button>
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
                            onClick={(e) => { e.stopPropagation(); confirmBet(); }}
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
                    <button onClick={(e) => { e.stopPropagation(); /* claim logic */ }} className="text-[10px] font-bold text-green-400 hover:underline">Claim Winnings</button>
                </div>
            )}
        </motion.div>
    );
};
