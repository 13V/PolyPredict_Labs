'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Clock, ArrowUpRight, Activity, Zap, Swords, Gavel, Newspaper, Tv, Globe } from 'lucide-react';
import { TeamLogo } from './TeamLogo';
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
    const { publicKey, connected, signTransaction, signAllTransactions } = useWallet();
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
    const [lastPriceUpdate, setLastPriceUpdate] = useState(0);

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

    // Team Parsing Logic for Sports
    const getTeams = () => {
        const fullSource = `${question} ${slug || ''} ${eventTitle || ''}`.toLowerCase();
        if (fullSource.includes(' vs ') || fullSource.includes(' vs. ')) {
            const parts = (eventTitle || question).split(/ vs\.? /i);
            if (parts.length === 2) {
                return [
                    parts[0].replace(/^Will\s+/i, '').replace(/\s+win\??$/i, '').trim(),
                    parts[1].replace(/\s+win\??$/i, '').replace(/\?$/, '').trim()
                ];
            }
        }
        return null;
    };

    const teams = getTeams();

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
                        if (prices[symbol]) {
                            if (prices[symbol] !== pythPrice) setLastPriceUpdate(Date.now());
                            setPythPrice(prices[symbol]);
                        }
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
                const { getProgram, getMarketPDA, getConfigPDA, getATA, BETTING_MINT, TOKEN_PROGRAM_ID } = await import('@/services/web3');
                const { BN } = await import('@project-serum/anchor');

                const program = getProgram({ publicKey, signTransaction, signAllTransactions });
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
                    authority: publicKey?.toString(),
                    tokenProgram: TOKEN_PROGRAM_ID?.toString()
                });

                if (!marketPda || !configPda || !vaultTokenAcc || !BETTING_MINT || !publicKey || !TOKEN_PROGRAM_ID) {
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
                    tokenProgram: TOKEN_PROGRAM_ID,
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

    const getCategoryIcon = (cat: string) => {
        const c = cat.toLowerCase();
        const q = question.toLowerCase();
        if (q.includes(' vs ') || q.includes(' vs. ') || c.includes('sport')) return Swords;
        if (c.includes('crypto')) return Zap;
        if (c.includes('politics')) return Gavel;
        if (c.includes('news')) return Newspaper;
        if (c.includes('pop') || c.includes('culture') || c.includes('movie')) return Tv;
        if (c.includes('science') || c.includes('tech')) return Globe;
        return Activity;
    };

    const CategoryIcon = getCategoryIcon(category);
    const displayCategory = (question.toLowerCase().includes(' vs ') || question.toLowerCase().includes(' vs. ')) ? 'SPORTS' : category;

    return (
        <div onClick={onOpenExpanded} className="relative group overflow-hidden neo-border neo-shadow bg-white cursor-pointer" style={{ paddingLeft: '1.25rem' }}>
            {/* Signal Sidebar */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 z-30 bg-orange-600 transition-all duration-300 group-hover:w-3`} />

            {/* Team Background Watermarks */}
            {teams && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.03] grayscale transition-opacity group-hover:opacity-10">
                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-96 h-96 rotate-[-12deg]">
                        <TeamLogo name={teams[0]} className="w-full h-full" />
                    </div>
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-96 h-96 rotate-[12deg]">
                        <TeamLogo name={teams[1]} className="w-full h-full" />
                    </div>
                </div>
            )}

            {/* Background Dot Grid */}
            <div className="absolute inset-0 dot-grid opacity-10" />

            <div className="relative grid lg:grid-cols-5">
                {/* Left Content */}
                <div className="lg:col-span-3 p-5 md:p-8 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-black order-1">

                    {/* Header Badges */}
                    <div className="flex items-center gap-0 mb-6">
                        <div className="flex items-center gap-2 px-3 py-1 bg-black text-white border-y border-l border-black italic">
                            <CategoryIcon size={12} strokeWidth={3} className="text-orange-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                {displayCategory}_PROTOCOL
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 border border-black bg-white text-black font-mono text-[10px] font-bold">
                            MARKET_REF: #{id.toString().padStart(4, '0')}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 border-y border-r border-black bg-gray-50 text-black/40 text-[10px] font-black uppercase tracking-widest hidden md:flex">
                            SYS_STATUS: {polymarketId && !isOnChain ? 'INIT_PENDING' : 'OPERATIONAL'}
                        </div>
                    </div>

                    {/* Main Title */}
                    <h2 className="text-2xl md:text-5xl font-black text-black mb-6 leading-[0.9] tracking-tighter max-w-2xl uppercase italic">
                        {displayTitle}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 md:gap-8 mb-8 border-t-2 border-black pt-6">
                        {/* Live Price */}
                        {pythPrice && (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <motion.div
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                                    />
                                    <span className="text-[9px] text-red-600 font-black uppercase tracking-[0.2em] animate-pulse">ORACLE_FEED_ACTIVE</span>
                                </div>
                                <span
                                    key={lastPriceUpdate}
                                    className="text-xl md:text-3xl font-mono font-black text-black flex items-center gap-2 animate-price-glitch"
                                >
                                    ${pythPrice.toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Vol */}
                        <div className="flex flex-col">
                            <span className="text-[9px] text-black/40 font-black uppercase tracking-widest mb-1 italic">Volume_PREDICT</span>
                            <span className="text-xl md:text-3xl font-mono font-black text-black">${totalLiquidity.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-24 md:h-32 w-full relative overflow-hidden opacity-30">
                        {pythData && <Sparkline data={pythData} width={600} height={128} color="#000000" />}
                    </div>

                    {/* Industrial Provenance */}
                    <div className="pt-4 flex justify-between items-center opacity-40">
                        <span className="text-[8px] font-mono uppercase tracking-[0.2em]">TRANS_LAYER: SOLANA_MAINNET_BETA</span>
                        <span className="text-[8px] font-mono uppercase tracking-[0.2em]">ORACLE: PYTH_NETWORK_L2</span>
                    </div>
                </div>

                {/* Right Action Panel */}
                <div className="lg:col-span-2 p-5 md:p-8 bg-gray-50 flex flex-col justify-center gap-6 order-2">
                    {/* Order Book Bar */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-[11px] font-black text-black uppercase tracking-[0.1em]">
                            <span>{outcomes[0]}: {yesPercent.toFixed(1)}%</span>
                            <span>{outcomes[1]}: {noPercent.toFixed(1)}%</span>
                        </div>
                        <div className="flex h-6 w-full border-2 border-black bg-white overflow-hidden p-[2px]">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${yesPercent}%` }} className="h-full bg-black" />
                            <div className="h-full flex-1 bg-white" />
                        </div>
                    </div>

                    {/* Betting Interface */}
                    {betMode === null ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); setBetMode(0); }}
                                disabled={isExpired}
                                className="group p-4 bg-white border-2 border-black neo-shadow-sm hover:neo-shadow hover:translate-y-[-2px] hover:bg-black hover:text-white transition-all overflow-hidden relative"
                            >
                                <div className="relative z-10">
                                    <span className="text-2xl block mb-1 truncate uppercase italic font-black">{outcomes[0]}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">POSITION_A</span>
                                </div>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setBetMode(1); }}
                                disabled={isExpired}
                                className="group p-4 bg-white border-2 border-black neo-shadow-sm hover:neo-shadow hover:translate-y-[-2px] hover:bg-black hover:text-white transition-all overflow-hidden relative"
                            >
                                <div className="relative z-10">
                                    <span className="text-2xl block mb-1 truncate uppercase italic font-black">{outcomes[1]}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">POSITION_B</span>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white p-6 border-2 border-black neo-shadow animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center mb-6 border-b border-black pb-2">
                                <span className="text-xs font-black text-black uppercase tracking-[0.1em]">POSITION: {outcomes[betMode]}</span>
                                <button onClick={(e) => { e.stopPropagation(); setBetMode(null) }} className="text-black font-black hover:scale-110">✕</button>
                            </div>
                            <div className="relative mb-6">
                                <input
                                    autoFocus
                                    type="number"
                                    placeholder="0.00"
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-black py-4 text-black font-mono font-black text-4xl focus:outline-none placeholder:text-gray-200"
                                />
                                <div className="absolute right-0 bottom-1">
                                    <span className="text-[10px] font-black text-black uppercase tracking-tighter opacity-30">$PREDICT_UNITS</span>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); confirmBet(); }}
                                className="w-full py-4 bg-black text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-orange-600 transition-colors"
                            >
                                {isInitializing ? 'LOADING_ORACLE...' : (polymarketId && !isOnChain ? 'INIT_AND_BET' : 'EXECUTE_TRADE')}
                            </button>
                        </div>
                    )}

                    <button onClick={(e) => { e.stopPropagation(); onOpenCreateModal?.() }} className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest text-center mt-2 underline italic">
                        Terminal_Create_Custom_Market
                    </button>
                </div>
            </div>

            {/* Loading Overlay */}
            {isInitializing && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-black border-t-transparent animate-spin mx-auto mb-4" />
                        <div className="text-black font-black uppercase tracking-[0.2em] animate-pulse">Initializing_Smart_Contract</div>
                    </div>
                </div>
            )}
        </div>
    );
};

