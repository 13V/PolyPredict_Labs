'use client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Clock,
    Trophy,
    ChevronRight,
    BarChart3,
    CheckCircle2,
    Zap,
    Swords,
    Gavel,
    Newspaper,
    Tv,
    Globe,
    Activity,
    Shield
} from 'lucide-react';
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
    description?: string;
    isOnChain?: boolean; // New prop for Real Betting status
    marketPublicKey?: string; // Blockchain Address
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
    description,
    isOnChain = false, // Default to false (Simulated)
    marketPublicKey,
    onOpenExpanded,
    onSettle
}: PredictionCardProps) => {
    const { publicKey, connected, signTransaction, signAllTransactions } = useWallet();
    const toast = useToast();
    const { trigger: haptic } = useHaptic();

    const [votedIndex, setVotedIndex] = useState<number | null>(null);
    const [betMode, setBetMode] = useState<number | null>(null);
    const [stakeAmount, setStakeAmount] = useState('');
    const [showAllOutcomes, setShowAllOutcomes] = useState(false);
    const [pythData, setPythData] = useState<number[] | null>(null);
    const [pythPrice, setPythPrice] = useState<number | null>(null);
    const [openPrice, setOpenPrice] = useState<number | null>(null);
    const [isInitializing, setIsInitializing] = useState(false); // Loading state for lazy init

    // Extraction Logic for "Up/Down" markets
    // Priority: Question -> Slug -> EventTitle -> Description
    const findTarget = () => {
        // Broaden search to include outcomes and description
        const fullSource = `${question} ${slug || ''} ${eventTitle || ''} ${description || ''} ${outcomes.join(' ')}`.toLowerCase();

        // 1. Check for standard money format ($96,000)
        const matchMoney = fullSource.match(/\$(\d{1,3}(,\d{3})*(\.\d+)?)/);
        if (matchMoney) return matchMoney[0];

        // 2. Check for "at" followed by price (price at 96000)
        const matchAt = fullSource.match(/at\s+(\d{1,3}k|\d{4,})/);
        if (matchAt) return `$${matchAt[1]}`;

        // 3. Fallback to numbers (including decimals and 'k'), but EXCLUDE timestamps
        // Improved regex for $92k, 2.8k, 92000, 92,000
        const matchDigits = fullSource.match(/(\$\d+(\.\d+)?k?)|(\d+(\.\d+)?k)|(\d{1,3}(,\d{3})+)|(\d{4,})/gi);
        if (matchDigits) {
            for (const m of matchDigits) {
                const clean = m.replace(/[$,]/g, '').toLowerCase();
                const val = clean.includes('k') ? parseFloat(clean) * 1000 : parseFloat(clean);

                // Numbers between 1 and 1 Billion are likely prices. Above that are likely timestamps.
                // Special case: ignore small numbers like "18" (date) or "2025" (year)
                if (val > 100 && val < 1000000000) {
                    return m.startsWith('$') ? m : `$${m}`;
                }
            }
        }

        return null;
    };

    const priceTarget = findTarget();

    const isCrypto = category.toLowerCase().includes('crypto') ||
        question.toLowerCase().match(/bitcoin|btc|ethereum|eth|solana|sol|price/i) ||
        slug?.toLowerCase().match(/bitcoin|btc|ethereum|eth|solana|sol|price/i);

    // Title Reconstruction Logic
    const reconstructTitle = () => {
        if (!isCrypto) return question;

        const q = question.toLowerCase();
        const s = slug?.toLowerCase() || '';
        const e = eventTitle?.toLowerCase() || '';
        const d = description?.toLowerCase() || '';
        const full = `${q} ${s} ${e} ${d}`;

        // 1. Detect "Up or Down" or "Price Prediction" patterns
        if (q.includes('up or down') || s.includes('up-or-down') || e.includes('up or down')) {
            let asset = 'Asset';
            if (full.includes('bitcoin') || full.includes('btc')) asset = 'Bitcoin';
            else if (full.includes('ethereum') || full.includes('eth')) asset = 'Ethereum';
            else if (full.includes('solana') || full.includes('sol')) asset = 'Solana';

            // Extract Time (e.g. 9PM, 10:00AM, December 19)
            // Extract Time (e.g. 9PM, 10:00AM, December 19)
            // Improved match for ET timezones and ranges
            const timeMatch = full.match(/(\d{1,2}(:\d{2})?\s*(AM|PM)(\s*ET)?)|((December|January|February|March|April|May|June|July|August|September|October|November)\s+\d{1,2})/i);
            const rawTime = timeMatch ? timeMatch[0] : '';
            // Proper capitalization for months (e.g. december -> December)
            const timeStr = rawTime ? ` by ${rawTime.charAt(0).toUpperCase() + rawTime.slice(1)}` : '';

            if (priceTarget) {
                return `${asset} above or under ${priceTarget}${timeStr}?`;
            }

            // IF STILL FAILED: Check Description for specific "above $X" or "at $X" text
            if (d) {
                const dMatch = d.match(/(above|at)\s+(\$\d+(\.\d+)?k?|\d{2,})/i);
                if (dMatch) return `${asset} above or under ${dMatch[2]}${timeStr}?`;
            }

            // ULTIMATE FALLBACK: For "Up or Down" markets with no target, it's usually "Close > Open"
            // Render as: "Bitcoin Greater or Less than $84,320?" (User Request)
            if (!priceTarget) {
                if (openPrice) {
                    return `${asset} Greater or Less than $${openPrice.toLocaleString()}${timeStr}?`;
                }
                return `${asset} Greater or Less than Daily Open${timeStr}?`;
            }
        }

        return question;
    };

    const displayTitle = reconstructTitle();

    // UNIVERSAL PROBE: Log all props once per ID to see what Polymarket is sending

    useEffect(() => {
        if (isCrypto) {
            console.log(
                `%c[Card ${id}] Init: "${question}" | Target: ${priceTarget} | Display: ${displayTitle}`,
                'background: #7c3aed; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
            );
        }
    }, [isCrypto, question, priceTarget, id, displayTitle]);

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
                        const [{ sparkline, openPrice }, prices] = await Promise.all([
                            getCoinGeckoSparkline(symbol),
                            getPythPrices([symbol])
                        ]);
                        if (sparkline.length > 0) setPythData(sparkline);
                        if (openPrice) setOpenPrice(openPrice);
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
                const interval = setInterval(pollPrice, 5000);
                return () => clearInterval(interval);
            }
        }
    }, [category, question, isCrypto, slug]);

    // Dynamic Category Coloring (Professional Themes)
    const getCategoryTheme = (cat: string) => {
        const c = cat.toLowerCase();
        const q = question.toLowerCase();
        // Heuristic: "vs" usually means sports
        if (q.includes(' vs ') || q.includes(' vs. ') || c.includes('sports')) return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)', text: 'text-amber-400', border: 'border-amber-500/30' };

        if (c.includes('crypto')) return { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.15)', text: 'text-cyan-400', border: 'border-cyan-500/30' };
        if (c.includes('politics')) return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)', text: 'text-red-400', border: 'border-red-500/30' };
        if (c.includes('esports')) return { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.15)', text: 'text-pink-400', border: 'border-pink-500/30' };
        if (c.includes('news')) return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-400', border: 'border-emerald-500/30' };
        return { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.15)', text: 'text-purple-400', border: 'border-cyan-500/30' }; // Default
    };

    const getCategoryIcon = (cat: string) => {
        const c = cat.toLowerCase();
        const q = question.toLowerCase();

        if (q.includes(' vs ') || q.includes(' vs. ') || c.includes('sport')) return Swords;
        if (c.includes('crypto')) return Zap;
        if (c.includes('politics')) return Gavel;
        if (c.includes('news')) return Newspaper;
        if (c.includes('pop') || c.includes('culture') || c.includes('movie')) return Tv;
        if (c.includes('science') || c.includes('tech')) return Globe;
        return Activity; // Default
    };

    const CategoryIcon = getCategoryIcon(category);
    const theme = getCategoryTheme(category);
    // Display category override
    const displayCategory = (question.toLowerCase().includes(' vs ') || question.toLowerCase().includes(' vs. ')) ? 'SPORTS' : category;

    useEffect(() => {
        if (publicKey) {
            const existingVote = getVote(id, publicKey.toString());
            if (existingVote && existingVote.outcomeIndex !== undefined) {
                setVotedIndex(existingVote.outcomeIndex);
            }
        }
    }, [publicKey, id, isCrypto, slug]);

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

    const confirmBet = async () => {
        if (betMode === null || !connected || !publicKey) return;

        const amount = parseFloat(stakeAmount);
        const MAX_BET = 1000000;

        if (isNaN(amount) || amount <= 0) {
            toast.error("Enter a valid amount");
            return;
        }

        if (amount > MAX_BET) {
            toast.error(`Exceeds max bet of ${MAX_BET.toLocaleString()} $PREDICT`);
            return;
        }

        haptic('success');

        let targetMarketId = id;

        // LAZY CREATION LOGIC
        if (polymarketId && !isOnChain) {
            console.log("Lazy Creating Market for:", polymarketId);
            setIsInitializing(true);
            const toastId = toast.loading("Initializing new market on-chain...");

            try {
                // Dynamically import web3 to avoid server issues
                const { getProgram, getMarketPDA, getConfigPDA, getATA, BETTING_MINT, TOKEN_PROGRAM_ID } = await import('@/services/web3');
                const { BN } = await import('@project-serum/anchor');
                const { SystemProgram, SYSVAR_RENT_PUBKEY } = await import('@solana/web3.js');

                const program = getProgram({ publicKey, signTransaction, signAllTransactions });
                if (!program) throw new Error("Wallet not connected");

                // Generate a new ID (Timestamp based)
                const newMarketId = Date.now();
                const mIdBN = new BN(newMarketId);
                const endTimeBN = new BN(endTime);

                // For Lazy Initialization, we default to a binary YES/NO structure
                // Outcomes[0] = YES, Outcomes[1] = NO

                const marketPda = (await getMarketPDA(newMarketId))[0];
                const configPda = await getConfigPDA();
                const vaultTokenAcc = await getATA(marketPda, BETTING_MINT);

                await program.methods.initializeMarket(
                    mIdBN,
                    endTimeBN,
                    question,
                    2, // outcomeCount
                    ["Yes", "No", "", "", "", "", "", ""],
                    null, // oracleKey
                    new BN(1), // minBet
                    new BN(1000000), // maxBet
                    "", // metadataUrl
                    polymarketId // Use the ID as slug/reference
                ).accounts({
                    market: marketPda,
                    config: configPda,
                    authority: publicKey,
                    vaultTokenAccount: vaultTokenAcc,
                    mint: BETTING_MINT,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY
                }).rpc();

                toast.success("Market Initialized! Placing vote...", { id: toastId });
                targetMarketId = newMarketId; // Use the new ON-CHAIN ID for the vote
                (window as any).lastInitializedPda = marketPda.toString(); // Store for saveVote

            } catch (e: any) {
                console.error("Lazy Init Failed:", e);
                toast.error(`Initialization Failed: ${e.message}`, { id: toastId });
                setIsInitializing(false);
                return;
            }
        }

        // Proceed to Vote (either on existing ID or new initialized ID)
        try {
            await saveVote({
                predictionId: targetMarketId,
                choice: 'multi',
                outcomeIndex: betMode,
                walletAddress: publicKey.toString(),
                marketPublicKey: marketPublicKey || (window as any).lastInitializedPda, // Fallback if we just created it
                timestamp: Date.now(),
                amount: amount
            }, { publicKey, signTransaction: undefined, sendTransaction: undefined });

            setVotedIndex(betMode);
            setBetMode(null);
            setIsInitializing(false);
            toast.success(`Bet placed on ${outcomes[betMode]}`);

            // Reload page after delay if we initialized, to sync state
            if (polymarketId && !isOnChain) {
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (e: any) {
            console.error("Vote failed:", e);
            toast.error(`Transaction failed: ${e.message || 'Check your wallet'}`);
            setIsInitializing(false);
        }
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
        <div
            onClick={onOpenExpanded}
            className={`terminal-card neo-shadow-sm p-4 md:p-5 flex flex-col gap-4 transition-all duration-200 relative overflow-hidden group hover:neo-shadow cursor-pointer ${isHot ? 'bg-orange-50/30' : 'bg-white'
                } ${(isExpired && !resolved) ? 'grayscale opacity-80' : ''}`}
            style={{
                borderColor: resolved ? '#000000' : '#000000',
            }}
        >
            {/* Market Closed Banner */}
            {isExpired && !resolved && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="rotate-[-5deg] bg-black text-white px-8 py-2 font-black text-2xl tracking-[0.3em] shadow-xl">
                        CLOSED
                    </div>
                </div>
            )}

            {/* Initializing Loading State */}
            {isInitializing && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                    <div className="w-10 h-10 border-[3px] border-black border-t-transparent animate-spin mb-4" />
                    <span className="text-sm font-bold text-black animate-pulse">SYNCING DATA...</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4 z-10">
                <div className="flex flex-col gap-1.5 flex-1 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 border border-black ${resolved ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}>
                            <CategoryIcon size={10} strokeWidth={3} className={resolved ? 'text-gray-500' : 'text-orange-500'} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{displayCategory}</span>
                        </div>

                        {/* Lazy Init Badge */}
                        {polymarketId && !isOnChain && !resolved && (
                            <span className="text-[10px] font-mono font-black uppercase bg-orange-500 text-white px-2 py-0.5 border border-black">
                                NEW
                            </span>
                        )}

                        {isHot && !resolved && <span className="text-[10px] font-black text-black flex items-center gap-1 bg-yellow-400 px-2 py-0.5 border border-black italic">
                            HOT
                        </span>}
                        {resolved && <span className="text-[10px] font-black text-white bg-green-600 px-2 py-0.5 border border-black flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            RESOLVED
                        </span>}
                    </div>
                    <h3 className={`font-outfit font-black text-xl leading-tight transition-colors uppercase italic ${resolved ? 'text-gray-400' : 'text-black'}`}>
                        {displayTitle}
                    </h3>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start w-full md:w-auto gap-4 md:gap-3 shrink-0 border-t md:border-t-0 border-black/10 pt-3 md:pt-0">
                    <div className="flex items-center gap-3">
                        <div className="opacity-10 text-black">
                            <CategoryIcon size={24} strokeWidth={2.5} />
                        </div>
                        <div className="w-14 h-8 opacity-60 group-hover:opacity-100 transition-all duration-500">
                            <Sparkline
                                data={pythData || getDeterministicPattern(id, outcomeProbabilities[0])}
                                width={56}
                                height={32}
                                color={resolved ? '#4b5563' : '#000000'}
                            />
                        </div>
                    </div>
                    {isCrypto && (
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 mb-1">
                                <motion.div
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.5)]"
                                />
                                <span className="text-[9px] text-red-600 uppercase font-black tracking-widest animate-pulse">LIVE_ORACLE</span>
                            </div>
                            <span className="text-xs font-mono font-black text-black flex items-center gap-1 bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {pythPrice ? `$${pythPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'OFFLINE'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Bar */}
            {
                !resolved && (
                    <div className="flex items-center gap-3 md:gap-4 text-[11px] font-black text-black z-10 border-b-2 border-black pb-2">
                        <div className="flex items-center gap-1.5 border-r border-black/10 pr-3 md:pr-4">
                            <Clock size={12} className={isExpired ? 'text-red-500' : 'text-black'} />
                            <span className={isExpired ? 'text-red-500' : ''}>{timeLeft()} <span className="hidden md:inline">REMAINING</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <BarChart3 size={12} className="text-black" />
                            <span className="text-[9px] text-black/40 mr-1 hidden md:inline">POOL_VOLUME:</span>
                            <span>{totalLiquidity.toLocaleString()} $PREDICT</span>
                        </div>
                    </div>
                )
            }

            {/* Outcomes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                {topOutcomes.map((idx) => (
                    <button
                        key={idx}
                        onClick={(e) => handleOutcomeClick(e, idx)}
                        disabled={isExpired || resolved}
                        className={`w-full group/btn relative h-14 border-2 transition-all flex items-center justify-between px-4 ${votedIndex === idx
                            ? 'bg-black text-white border-black neo-shadow-sm'
                            : 'bg-white border-black neo-shadow-sm hover:translate-y-[-2px] hover:neo-shadow'
                            } ${resolved && winningOutcome !== idx ? 'opacity-40 grayscale' : ''} ${isExpired && !resolved ? 'cursor-not-allowed' : ''}`}
                    >
                        {/* Probability Fill */}
                        <div
                            className={`absolute inset-0 opacity-10 ${votedIndex === idx ? 'bg-white' : 'bg-black'}`}
                            style={{ width: `${outcomeProbabilities[idx]}%` }}
                        />

                        <div className="relative z-10 flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                                {resolved && winningOutcome === idx && <Trophy size={14} className="text-yellow-400" />}
                                <span className="text-sm font-black uppercase tracking-tight">
                                    {outcomes[idx]}
                                    {priceTarget && (
                                        outcomes[idx].toLowerCase().includes('up') ||
                                        outcomes[idx].toLowerCase().includes('down') ||
                                        outcomes[idx].toLowerCase().includes('yes') ||
                                        outcomes[idx].toLowerCase().includes('no')
                                    ) && (
                                            <span className="ml-1 text-[10px] font-normal opacity-60">
                                                {(outcomes[idx].toLowerCase().includes('up') || outcomes[idx].toLowerCase().includes('yes')) ? '>' : '<'} {priceTarget}
                                            </span>
                                        )}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-black ${votedIndex === idx ? 'text-white' : 'text-black'}`}>
                                    {outcomeProbabilities[idx].toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </button>
                ))}

                {outcomes.length > 2 && !resolved && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowAllOutcomes(!showAllOutcomes); }}
                        className="text-[10px] font-black uppercase tracking-widest text-black hover:underline py-1 self-center col-span-full"
                    >
                        {showAllOutcomes ? 'Show Less' : `+ [ ${outcomes.length - 2} ] MORE OUTCOMES`}
                    </button>
                )}
            </div>


            {/* Bet Modal Overlay */}
            <AnimatePresence mode="wait">
                {betMode !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-0 bottom-0 bg-white border-t-2 border-black p-5 flex flex-col gap-4 z-20"
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-black uppercase tracking-tighter">Stake: {outcomes[betMode]}</span>
                                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 border border-black/10">PLATFORM_FEE: 10%</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setBetMode(null); }} className="text-black font-black hover:scale-110">✕</button>
                        </div>
                        <div className="relative">
                            <input
                                autoFocus
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-14 bg-gray-50 border-2 border-black px-4 font-mono font-black text-2xl focus:bg-white focus:outline-none transition-all placeholder:text-gray-300"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end">
                                <span className="text-xs font-black text-black">$PREDICT</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {['100', '500', '1k', '5k'].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setStakeAmount(val.replace('k', '000'))}
                                    className="h-8 border-2 border-black bg-white hover:bg-black hover:text-white text-[10px] font-black uppercase transition-colors"
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); confirmBet(); }}
                            className="w-full h-14 bg-black text-white font-black uppercase tracking-widest text-sm neo-shadow-sm hover:translate-y-[-2px] hover:neo-shadow active:translate-y-[2px] active:neo-shadow-none transition-all"
                        >
                            {isOnChain || !polymarketId ? 'CONFIRM FORECAST' : 'INITIALIZE & PREDICT'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer / Status */}
            {
                resolved && (
                    <div className="pt-2 border-t-2 border-black flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ARCHIVED RECORD</span>
                        <button onClick={(e) => { e.stopPropagation(); /* claim logic */ }} className="text-[10px] font-black text-green-600 hover:underline uppercase tracking-tighter">REDEEM WINNINGS</button>
                    </div>
                )
            }
        </div>
    );
};
