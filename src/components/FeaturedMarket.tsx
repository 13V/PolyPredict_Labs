'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Clock, ArrowUpRight, Activity } from 'lucide-react';
import { Sparkline } from './Sparkline';

import { useState, useEffect } from 'react';
import { saveVote, getVote } from '@/utils/voteStorage';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/context/ToastContext';
import { useHaptic } from '@/hooks/useHaptic';
import { getPythSparkline, getPythPrices } from '@/services/pyth';
import { getCoinGeckoSparkline } from '@/services/coingecko';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';

interface FeaturedMarketProps {
    data: any; // Using any for flexibility to match PredictionCard shape
    onOpenCreateModal?: () => void;
    onOpenExpanded?: () => void;
}

export const FeaturedMarket = ({ data, onOpenCreateModal, onOpenExpanded }: FeaturedMarketProps) => {
    const { publicKey, connected } = useWallet();
    const toast = useToast();
    const { trigger: haptic } = useHaptic(); // Use haptic hook

    // Default safe accessors
    const id = data?.id || 0;
    const question = data?.question || "Loading Market...";
    const category = data?.category || "Crypto";
    const endTime = data?.endTime || Date.now() / 1000;
    const outcomes = data?.outcomes || ["Yes", "No"];
    const totals = data?.totals || [50, 50];
    const totalLiquidity = data?.totalLiquidity || 0;
    const polymarketId = data?.polymarketId;
    const isOnChain = data?.isOnChain || false;
    const slug = data?.slug;
    const eventTitle = data?.eventTitle;
    const description = data?.description;
    const marketPublicKey = data?.marketPublicKey;

    const [betMode, setBetMode] = useState<number | null>(null);
    const [stakeAmount, setStakeAmount] = useState('');
    const [pythData, setPythData] = useState<number[] | null>(null);
    const [pythPrice, setPythPrice] = useState<number | null>(null);
    const [openPrice, setOpenPrice] = useState<number | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    // --- RECONSTRUCTION LOGIC (Parity with PredictionCard) ---
    const findTarget = () => {
        const fullSource = `${question} ${slug || ''} ${eventTitle || ''} ${description || ''} ${outcomes.join(' ')}`.toLowerCase();

        // 1. Money ($96,000)
        const matchMoney = fullSource.match(/\$(\d{1,3}(,\d{3})*(\.\d+)?)/);
        if (matchMoney) return matchMoney[0];

        // 2. "At" price
        const matchAt = fullSource.match(/at\s+(\d{1,3}k|\d{4,})/);
        if (matchAt) return `$${matchAt[1]}`;

        // 3. Digits
        const matchDigits = fullSource.match(/(\$\d+(\.\d+)?k?)|(\d+(\.\d+)?k)|(\d{1,3}(,\d{3})+)|(\d{4,})/gi);
        if (matchDigits) {
            for (const m of matchDigits) {
                const clean = m.replace(/[$,]/g, '').toLowerCase();
                const val = clean.includes('k') ? parseFloat(clean) * 1000 : parseFloat(clean);
                if (val > 100 && val < 1000000000) return m.startsWith('$') ? m : `$${m}`;
            }
        }
        return null;
    };

    const priceTarget = findTarget();
    const isCrypto = category.toLowerCase().includes('crypto') ||
        question.toLowerCase().match(/bitcoin|btc|ethereum|eth|solana|sol|price/i);

    const reconstructTitle = () => {
        if (!isCrypto) return question;
        const q = question.toLowerCase();

        // Detect "Up or Down"
        if (q.includes('up or down')) {
            let asset = 'Asset';
            if (q.includes('bitcoin') || q.includes('btc')) asset = 'Bitcoin';
            else if (q.includes('ethereum') || q.includes('eth')) asset = 'Ethereum';
            else if (q.includes('solana') || q.includes('sol')) asset = 'Solana';

            if (priceTarget) return `${asset} above or under ${priceTarget}?`;
            if (openPrice) return `${asset} Greater or Less than $${openPrice.toLocaleString()}?`;
            return `${asset} Up or Down?`;
        }
        return question;
    };

    const displayTitle = reconstructTitle();

    // --- PYTH & SPARKLINE ---
    useEffect(() => {
        if (isCrypto) {
            const q = `${question} ${slug || ''}`.toLowerCase();
            let symbol = '';
            if (q.includes('bitcoin') || q.includes('btc')) symbol = 'BTC';
            else if (q.includes('ethereum') || q.includes('eth')) symbol = 'ETH';
            else if (q.includes('solana') || q.includes('sol')) symbol = 'SOL';

            if (symbol) {
                const initFetch = async () => {
                    try {
                        const [{ sparkline, openPrice: op }, prices] = await Promise.all([
                            getCoinGeckoSparkline(symbol),
                            getPythPrices([symbol])
                        ]);
                        if (sparkline.length > 0) setPythData(sparkline);
                        if (op) setOpenPrice(op);
                        if (prices[symbol]) setPythPrice(prices[symbol]);
                    } catch (e) {
                        console.error('Featured data fetch error:', e);
                    }
                };
                initFetch();
            }
        }
    }, [isCrypto, question, slug]);

    // --- BETTING LOGIC (Lazy Creation) ---
    const confirmBet = async () => {
        if (betMode === null || !connected || !publicKey) return;

        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Enter a valid amount");
            return;
        }

        haptic('success');
        let targetMarketId = id;

        // Lazy Init
        if (polymarketId && !isOnChain) {
            setIsInitializing(true);
            const toastId = toast.loading("Initializing Featured Market...");
            try {
                const { getProgram, getMarketPDA, getConfigPDA, getATA, BETTING_MINT } = await import('@/services/web3');
                const { BN } = await import('@project-serum/anchor');

                const program = getProgram({ publicKey, signTransaction: undefined, sendTransaction: undefined });
                if (!program) throw new Error("Wallet not connected");

                const newMarketId = Date.now();
                const marketPda = (await getMarketPDA(newMarketId))[0];
                const configPda = await getConfigPDA();
                const vaultTokenAcc = await getATA(marketPda, BETTING_MINT);

                console.log("DEBUG INIT:", {
                    marketPda: marketPda?.toString(),
                    configPda: configPda?.toString(),
                    vaultTokenAcc: vaultTokenAcc?.toString(),
                    mint: BETTING_MINT?.toString(),
                    authority: publicKey?.toString()
                });

                if (!marketPda || !configPda || !vaultTokenAcc || !BETTING_MINT || !publicKey) {
                    throw new Error("Missing critical keys for initialization");
                }

                await program.methods.initializeMarket(
                    new BN(newMarketId),
                    new BN(endTime),
                    question,
                    2,
                    ["Yes", "No", "", "", "", "", "", ""],
                    null,
                    new BN(1),
                    new BN(1000000),
                    "",
                    polymarketId
                ).accounts({
                    market: marketPda,
                    config: configPda,
                    authority: publicKey,
                    vaultTokenAccount: vaultTokenAcc,
                    mint: BETTING_MINT,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                    rent: SYSVAR_RENT_PUBKEY
                }).rpc();

                toast.success("Market Initialized!", { id: toastId });
                targetMarketId = newMarketId;
                (window as any).lastInitializedPda = marketPda.toString();
            } catch (e: any) {
                console.error("Lazy Init Failed:", e);
                toast.error(`Init Failed: ${e.message}`, { id: toastId });
                setIsInitializing(false);
                return;
            }
        }

        try {
            await saveVote({
                predictionId: targetMarketId,
                choice: 'multi',
                outcomeIndex: betMode,
                walletAddress: publicKey!.toString(),
                marketPublicKey: marketPublicKey || (window as any).lastInitializedPda,
                timestamp: Date.now(),
                amount: amount
            }, { publicKey, signTransaction: undefined, sendTransaction: undefined });

            setIsInitializing(false);
            setBetMode(null);
            toast.success(`Bet placed on ${outcomes[betMode]}`);

            if (polymarketId && !isOnChain) setTimeout(() => window.location.reload(), 2000);
        } catch (e: any) {
            console.error("Vote failed:", e);
            toast.error(`Transaction failed: ${e.message || 'Check your wallet'}`);
            setIsInitializing(false);
        }
    };

    // --- UI HELPERS ---
    const totalVotes = totals.reduce((a: number, b: number) => a + b, 0);
    const yesPercent = totalVotes > 0 ? (totals[0] / totalVotes) * 100 : 50;
    const noPercent = 100 - yesPercent;

    const isExpired = Date.now() > endTime * 1000;

    return (
        <div onClick={onOpenExpanded} className="relative group rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-[#0a0a0a] cursor-pointer">
            {/* Backgrounds */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-black/0 to-black/0" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

            <div className="relative grid lg:grid-cols-5">
                {/* Left Content */}
                <div className="lg:col-span-3 p-5 md:p-10 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-white/5 order-1">

                    {/* Header Badges */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="bg-white/5 border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-2 uppercase tracking-widest">
                            <TrendingUp size={12} className="text-blue-400" /> Featured
                        </span>
                        {polymarketId && !isOnChain && (
                            <span className="bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest animate-pulse">
                                Initialize Me
                            </span>
                        )}
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {category} • {new Date(endTime * 1000).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Main Title */}
                    <h2 className="text-xl md:text-4xl font-black text-white mb-6 leading-tight tracking-tight max-w-2xl">
                        {displayTitle}
                    </h2>

                    {/* Stats Row */}
                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-4 md:gap-8 mb-8">
                        {/* Live Price */}
                        {pythPrice && (
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Live Oracle</span>
                                <span className="text-lg md:text-xl font-mono font-bold text-white flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    ${pythPrice.toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Vol */}
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Volume</span>
                            <span className="text-lg md:text-xl font-mono font-bold text-white text-blue-400">${totalLiquidity.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-24 md:h-32 w-full relative overflow-hidden mask-linear-fade opacity-40">
                        {pythData && <Sparkline data={pythData} width={600} height={128} color="#3b82f6" />}
                    </div>
                </div>

                {/* Right Action Panel */}
                <div className="lg:col-span-2 p-5 md:p-10 bg-white/[0.02] backdrop-blur-sm flex flex-col justify-center gap-6 order-2">
                    {/* Order Book Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <span>{outcomes[0]} {yesPercent.toFixed(0)}%</span>
                            <span>{outcomes[1]} {noPercent.toFixed(0)}%</span>
                        </div>
                        <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-800">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${yesPercent}%` }} className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
                            <div className="h-full flex-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                        </div>
                    </div>

                    {/* Betting Interface */}
                    {betMode === null ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); setBetMode(0); }}
                                disabled={isExpired}
                                className="group p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-xl transition-all active:scale-95"
                            >
                                <span className="text-green-400 font-black text-xl md:text-2xl block mb-1 truncate">{outcomes[0]}</span>
                                <span className="text-[10px] text-green-300 font-bold uppercase tracking-widest group-hover:underline">Bet Up</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setBetMode(1); }}
                                disabled={isExpired}
                                className="group p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all active:scale-95"
                            >
                                <span className="text-red-400 font-black text-xl md:text-2xl block mb-1 truncate">{outcomes[1]}</span>
                                <span className="text-[10px] text-red-300 font-bold uppercase tracking-widest group-hover:underline">Bet Down</span>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 animate-in slide-in-from-bottom-2 fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase">Bet {betMode === 0 ? outcomes[0] : outcomes[1]}</span>
                                <button onClick={(e) => { e.stopPropagation(); setBetMode(null) }} className="text-gray-500 hover:text-white">✕</button>
                            </div>
                            <input
                                autoFocus
                                type="number"
                                placeholder="Amount"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono font-bold mb-3 focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); confirmBet(); }}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                {isInitializing ? 'INITIALIZING...' : (polymarketId && !isOnChain ? 'INITIALIZE & BET' : 'PLACE BET')}
                            </button>
                        </div>
                    )}

                    <button onClick={(e) => { e.stopPropagation(); onOpenCreateModal?.() }} className="text-[10px] font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest text-center mt-2">
                        + Create Custom Market
                    </button>
                </div>
            </div>

            {/* Loading Overlay */}
            {isInitializing && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <div className="text-blue-400 font-bold animate-pulse">Initializing Chain Market...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

