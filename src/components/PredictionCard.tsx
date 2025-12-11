'use client';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Clock, Trophy } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { saveVote, getVote, getVoteCounts, getResolutionStatus, saveResolution } from '@/utils/voteStorage';
import { hasMinimumTokens } from '@/utils/tokenGating';
import { getDeterministicPattern } from '@/utils/chartPatterns';
import { fetchMarketResult } from '@/services/polymarket';
import { Sparkline } from './Sparkline';
import { ResolutionPanel } from './ResolutionPanel';

interface PredictionCardProps {
    id: number;
    category: string;
    question: string;
    timeLeft: string;
    yesVotes: number;
    noVotes: number;
    totalVolume?: number;
    outcomeLabels?: string[]; // Optional custom labels
    status?: 'active' | 'resolving' | 'resolved'; // NEW: Status
}

export const PredictionCard = ({
    id,
    category,
    question,
    timeLeft,
    yesVotes: initialYes,
    noVotes: initialNo,
    totalVolume,
    outcomeLabels, // Destructure new prop
    status = 'active' // Default to active
}: PredictionCardProps) => {
    const { publicKey, connected } = useWallet();
    // ... existing hooks ...
    const [yesVotes, setYesVotes] = useState(initialYes);
    const [noVotes, setNoVotes] = useState(initialNo);
    const [voted, setVoted] = useState<'yes' | 'no' | null>(null);
    const [hasTokens, setHasTokens] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Betting UI State
    const [betMode, setBetMode] = useState<'yes' | 'no' | null>(null);
    const [stakeAmount, setStakeAmount] = useState('');

    // Default labels
    const yesLabel = outcomeLabels?.[0] || 'YES';
    const noLabel = outcomeLabels?.[1] || 'NO';

    const checkTokenBalance = useCallback(async () => {
        if (!publicKey) return;

        setIsChecking(true);
        const hasMin = await hasMinimumTokens(publicKey.toString());
        setHasTokens(hasMin);
        setIsChecking(false);
    }, [publicKey]);

    // ... (inside component)

    const [resolvedOutcome, setResolvedOutcome] = useState<'yes' | 'no' | null>(null);

    // Load existing vote and vote counts on mount
    useEffect(() => {
        if (publicKey) {
            const existingVote = getVote(id, publicKey.toString());
            if (existingVote) {
                setVoted(existingVote.choice);
            }
            checkTokenBalance();
        }

        // Check for global resolution (DAO or Oracle)
        const outcome = getResolutionStatus(id);
        if (outcome) {
            setResolvedOutcome(outcome);
        } else if (status === 'resolving') {
            // AUTO-ORACLE: If confirming validation, ask Polymarket
            checkOracle();
        }

        // Load vote counts from localStorage
        const counts = getVoteCounts(id);
        setYesVotes(initialYes + counts.yes);
        setNoVotes(initialNo + counts.no);
    }, [publicKey, id, initialYes, initialNo, checkTokenBalance, status]); // Added status dependency

    const checkOracle = async () => {
        const result = await fetchMarketResult(id);
        if (result) {
            console.log(`Oracle Resolved Market #${id}: ${result.toUpperCase()}`);
            setResolvedOutcome(result);
            saveResolution(id, result); // Persist it so we don't fetch every time
        }
    };

    // Derived status: Prop or Resolved State
    const currentStatus = resolvedOutcome ? 'resolved' : status;

    // ... handleVote ...

    const handleVoteClick = (choice: 'yes' | 'no') => {
        if (!connected || !publicKey) {
            alert('Please connect your wallet first!');
            return;
        }
        if (voted) return;
        if (!hasTokens) {
            alert('Insufficient $PROPHET tokens!');
            return;
        }
        setBetMode(choice); // Activate Input Mode
    };

    const confirmBet = async () => {
        if (!betMode || !publicKey) return;

        if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
            alert('Enter a valid amount');
            return;
        }

        // Save vote (Mock Contract Call)
        const vote = {
            predictionId: id,
            choice: betMode,
            walletAddress: publicKey.toString(),
            timestamp: Date.now(),
            amount: parseFloat(stakeAmount) // Save amount
        };

        saveVote(vote);

        // Update local state
        if (betMode === 'yes') {
            setYesVotes(prev => prev + 1);
        } else {
            setNoVotes(prev => prev + 1);
        }
        setVoted(betMode);
        setBetMode(null); // Reset UI
    };

    const totalVotes = yesVotes + noVotes;
    const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 50;
    const noPercentage = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 50;

    // Generate a deterministic, unique sparkline shape that ends at the current price
    const sparkData = getDeterministicPattern(id, yesPercentage);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group relative flex flex-col justify-between rounded-2xl transition-all overflow-hidden h-full backdrop-blur-xl ${status === 'resolving'
                ? 'bg-blue-950/20 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                : 'bg-gray-900/40 border border-white/5 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1'
                }`}
        >
            {/* Ambient Background Gradient (Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-4 flex items-start justify-between">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                        {resolvedOutcome ? <Trophy className={resolvedOutcome === 'yes' ? 'text-green-500' : 'text-red-500'} size={20} /> :
                            category === 'BTC' || category === 'CRYPTO' ? <span className="text-xl">₿</span> :
                                category === 'ETH' ? <span className="text-xl">Ξ</span> :
                                    category === 'SOL' ? <span className="text-xl">◎</span> :
                                        <TrendingUp className="text-gray-400" size={20} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{category}</span>
                            <span className={`text-[10px] ${currentStatus === 'resolving' ? 'text-blue-400 font-bold animate-pulse' :
                                currentStatus === 'resolved' ? 'text-amber-400 font-bold' :
                                    'text-gray-600'
                                }`}>
                                • {currentStatus === 'resolving' ? 'AWAITING VERIFICATION' :
                                    currentStatus === 'resolved' ? 'MARKET CLOSED' :
                                        `Ends ${timeLeft}`}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 min-h-[40px]">
                            {question}
                        </h3>
                    </div>
                </div>

                {/* Mini Sparkline */}
                <div className="w-[60px] h-[30px] opacity-50 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={sparkData} width={60} height={30} color={yesPercentage >= 50 ? '#10B981' : '#EF4444'} />
                </div>
            </div>

            {/* Middle: Stats */}
            <div className="px-4 pb-4">
                <div className="flex items-end justify-between mb-2">
                    <span className={`text-2xl font-black ${yesPercentage >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {yesPercentage.toFixed(0)}%
                        <span className="text-xs font-normal text-gray-500 ml-1">chance</span>
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                        ${totalVolume ? totalVolume.toLocaleString() : (totalVotes * 10.5).toLocaleString()} Vol
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${yesPercentage}%` }} className="h-full bg-green-500" />
                    <div style={{ width: `${noPercentage}%` }} className="h-full bg-red-500" />
                </div>
            </div>

            {/* Token Gating Warning (Only show if active) */}
            {!hasTokens && connected && status !== 'resolving' && (
                <div className="mx-4 mb-2 text-center">
                    <p className="text-[10px] text-red-400 bg-red-900/20 py-1 rounded border border-red-500/20">
                        ⚠ Must hold 1000+ $PROPHET to vote
                    </p>
                </div>
            )}

            {/* Bottom Actions: Either Voting OR Resolution */}
            <div className="px-4 pb-4 mt-auto">
                {/* Bottom Actions: Check Resolved state FIRST */}
                {resolvedOutcome ? (
                    <div className="text-center">
                        <h4 className="text-sm font-bold mb-2">Market Resolved: {resolvedOutcome === 'yes' ? yesLabel : noLabel} Won!</h4>
                        {voted === resolvedOutcome ?
                            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">Claim Winnings 💰 (~1.85x)</button> :
                            <p className="text-red-500 font-bold">Rekt 💀</p>
                        }
                        <p className="text-xs text-gray-400 mt-1">(-10% tax)</p>
                    </div>
                ) : status === 'resolving' ? (
                    <ResolutionPanel
                        id={id}
                        yesLabel={yesLabel}
                        noLabel={noLabel}
                        onResolve={(outcome) => console.log('Resolved:', outcome)}
                    />
                ) : betMode ? (
                    // BETTING INPUT MODE
                    <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-xs font-bold uppercase ${betMode === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                                Bet on {betMode === 'yes' ? yesLabel : noLabel}
                            </span>
                            <button onClick={() => setBetMode(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
                        </div>

                        <div className="relative mb-2">
                            <input
                                type="number"
                                placeholder="Amount"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="w-full bg-black/50 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                            />
                            <span className="absolute right-2 top-1.5 text-xs text-gray-500 font-bold">$PROPHET</span>
                        </div>

                        <button
                            onClick={confirmBet}
                            className={`w-full py-1.5 rounded text-xs font-bold text-white transition-colors ${betMode === 'yes' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                                }`}
                        >
                            Confirm Bet
                        </button>
                    </div>
                ) : (
                    // STANDARD VOTE BUTTONS
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleVoteClick('yes')}
                            className={`py-2 rounded-lg text-xs font-bold transition-colors border ${!hasTokens && connected
                                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed opacity-50'
                                : 'bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black border-green-500/20'
                                }`}
                        >
                            {yesLabel} {yesPercentage.toFixed(0)}¢
                        </button>
                        <button
                            onClick={() => handleVoteClick('no')}
                            className={`py-2 rounded-lg text-xs font-bold transition-colors border ${!hasTokens && connected
                                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed opacity-50'
                                : 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-red-500/20'
                                }`}
                        >
                            {noLabel} {noPercentage.toFixed(0)}¢
                        </button>
                    </div>
                )}
            </div>
        </motion.div >
    );
};
