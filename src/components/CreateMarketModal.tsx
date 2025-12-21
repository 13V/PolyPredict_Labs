'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Unlock, Rocket, Calendar, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallet } from '@solana/wallet-adapter-react';
import { saveUserMarket } from '@/utils/marketStorage';
import { hasMinimumTokens, getTokenBalance } from '@/utils/tokenGating';
import { getProgram, getMarketPDA, getConfigPDA, getATA, BETTING_MINT, TOKEN_PROGRAM_ID } from '@/services/web3';
import { BN } from '@project-serum/anchor';
import { toast } from 'react-hot-toast';
import { SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';

interface CreateMarketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CREATION_THRESHOLD = 5000000; // 5M $PREDICT to create

export const CreateMarketModal = ({ isOpen, onClose }: CreateMarketModalProps) => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [eligible, setEligible] = useState(false);
    const [withinLimit, setWithinLimit] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [lastCreationTime, setLastCreationTime] = useState<number | null>(null);

    // Variants for responsive animation
    const modalVariants: any = {
        hidden: {
            opacity: 0,
            y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 20,
            scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        },
        exit: {
            opacity: 0,
            y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 20,
            scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.95
        }
    };


    // Form State
    const [question, setQuestion] = useState('');
    const [category, setCategory] = useState('CRYPTO');
    const [endDate, setEndDate] = useState('');
    const [mintConf, setMintConf] = useState(''); // Pump.fun Mint Address

    useEffect(() => {
        if (isOpen && publicKey) {
            checkEligibility();
        }
    }, [isOpen, publicKey]);

    const checkDailyLimit = async () => {
        if (!publicKey) return;
        try {
            const program = getProgram({ publicKey, signTransaction: undefined, sendTransaction: undefined });
            if (!program) return;

            // Fetch all markets authored by this user
            const myMarkets = await program.account.market.all([
                {
                    memcmp: {
                        offset: 8, // Authority is the first field after discriminator
                        bytes: publicKey.toBase58()
                    }
                }
            ]);

            if (myMarkets.length > 0) {
                // Sort by creation time (marketId is the timestamp)
                const sorted = myMarkets.sort((a: any, b: any) => b.account.marketId.toNumber() - a.account.marketId.toNumber());
                const lastCreation = sorted[0].account.marketId.toNumber();
                const now = Date.now();
                const dayInMs = 24 * 60 * 60 * 1000;

                setLastCreationTime(lastCreation);
                setWithinLimit(now - lastCreation > dayInMs);
            } else {
                setWithinLimit(true);
            }
        } catch (e) {
            console.error("Failed to check daily limit:", e);
        }
    };

    const checkEligibility = async () => {
        if (!publicKey) return;
        setIsLoading(true);
        try {
            const bal = await getTokenBalance(publicKey.toString());
            setBalance(bal);
            setEligible(bal >= CREATION_THRESHOLD);

            if (bal >= CREATION_THRESHOLD) {
                await checkDailyLimit();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey) return;

        setIsLoading(true);
        try {
            const program = getProgram({ publicKey, signTransaction, signAllTransactions });
            if (!program) throw new Error("Wallet not connected");

            const marketId = new BN(Date.now());
            const endTimeBN = new BN(Math.floor(new Date(endDate).getTime() / 1000));
            const outcomeNames = [
                "YES", "NO", "", "", "", "", "", ""
            ];

            const marketPda = (await getMarketPDA(marketId.toNumber()))[0];
            const configPda = await getConfigPDA();
            const vaultTokenAcc = await getATA(marketPda, BETTING_MINT);

            console.log("Initializing Market on-chain...");

            await program.methods.initializeMarket(
                marketId,
                endTimeBN,
                question,
                2, // outcomeCount
                outcomeNames,
                null, // oracleKey
                new BN(1), // minBet
                new BN(1000000), // maxBet
                "", // metadataUrl
                ""  // polymarketId
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

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            toast.success("Market Successfully Created Globally! 🚀");
            onClose();
            // We'll let page.tsx fetch the new market from chain
            setTimeout(() => window.location.reload(), 2000);
        } catch (err: any) {
            console.error("Initialization failed:", err);
            toast.error(`Creation failed: ${err.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const eligibilityStatus = !eligible ? 'access_denied' : !withinLimit ? 'limit_reached' : 'ready';

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                {isOpen && (
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-md bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Status Bar */}
                        <div className="bg-black text-[8px] font-mono text-white/40 px-3 py-1 flex justify-between uppercase font-bold">
                            <span>TERMINAL_SESSION: CREATE_MARKET</span>
                            <span>STATUS: {isLoading ? 'SYNCING...' : eligibilityStatus.toUpperCase()}</span>
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b-2 border-black">
                            <h2 className="text-xl font-black text-black flex items-center gap-2 uppercase tracking-tighter italic leading-none">
                                <Rocket className="text-orange-600" size={24} />
                                LAUNCH_MARKET
                            </h2>
                            <button onClick={onClose} className="p-1 border border-black hover:bg-black hover:text-white transition-colors">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-6">
                                    <div className="w-10 h-10 border-4 border-black border-t-orange-600 animate-spin" />
                                    <p className="text-black font-mono text-[10px] font-black uppercase tracking-widest">VERIFYING_CREDENTIALS...</p>
                                </div>
                            ) : !eligible ? (
                                // LOCKED STATE
                                <div className="text-center py-6 border-2 border-red-600 bg-red-50/50">
                                    <div className="bg-black text-white w-16 h-16 border-2 border-black flex items-center justify-center mx-auto mb-6">
                                        <Lock size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-black mb-2 uppercase tracking-tighter italic">WHALES_ONLY_PROTOCOL</h3>
                                    <p className="text-black/60 text-[10px] font-mono font-bold mb-6 max-w-[85%] mx-auto uppercase">
                                        REQUIRED_THRESHOLD: {CREATION_THRESHOLD.toLocaleString()} $PREDICT_TOKENS
                                    </p>
                                    <div className="border-t-2 border-black p-4 bg-white">
                                        <p className="text-[8px] text-black/40 uppercase tracking-[0.2em] font-black mb-1">CURRENT_SIGNATURE_BALANCE</p>
                                        <p className="text-2xl font-mono font-black text-black uppercase">
                                            {balance !== null ? balance.toLocaleString() : '0'} $PREDICT
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                // UNLOCKED FORM
                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div className="bg-orange-50 border-2 border-orange-600 p-4 flex items-center gap-4">
                                        <div className="bg-orange-600 text-white p-2 border-2 border-black">
                                            <Unlock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic leading-none">ACCESS_GRANTED</p>
                                            <p className="text-xs font-mono font-bold text-black uppercase">{balance?.toLocaleString()} $PREDICT_VERIFIED</p>
                                        </div>
                                    </div>

                                    {!withinLimit && (
                                        <div className="border-2 border-black p-4 flex flex-col items-center text-center gap-3 bg-gray-50">
                                            <Calendar className="text-black" size={28} />
                                            <h3 className="text-black font-black uppercase tracking-widest text-xs italic leading-none">THROTTLE_ACTIVE</h3>
                                            <p className="text-[10px] font-mono font-bold text-black/60 uppercase">
                                                PROTOCOL_LIMIT: 01_MARKET_PER_24H_CYCLE
                                            </p>
                                            <div className="mt-1 text-[8px] font-mono font-black bg-black text-white px-3 py-1 uppercase tracking-widest">
                                                NEXT_WINDOW: {new Date(lastCreationTime! + (24 * 60 * 60 * 1000)).toLocaleString().toUpperCase()}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest">
                                            PUMP_UTILITY_GATING_ADDR
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="HqQq...pump_INTEL"
                                            className="w-full bg-white border-2 border-black px-4 py-3 text-black focus:bg-orange-50 focus:outline-none transition-colors font-mono text-xs font-bold uppercase placeholder:text-black/20"
                                            value={mintConf}
                                            onChange={e => setMintConf(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest italic">PREDICTION_PROMPT</label>
                                        <textarea
                                            placeholder="E.G. WILL_SOLANA_HIT_ATH_BEFORE_2026?"
                                            className="w-full bg-white border-2 border-black px-4 py-3 text-black focus:bg-orange-50 focus:outline-none transition-colors font-black uppercase tracking-tighter text-sm h-24 resize-none"
                                            value={question}
                                            onChange={e => setQuestion(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest italic flex items-center gap-1">
                                                <Tag size={10} /> CATEGORY
                                            </label>
                                            <select
                                                className="w-full bg-white border-2 border-black px-4 py-3 text-black font-black uppercase tracking-tighter text-sm focus:bg-orange-50 focus:outline-none cursor-pointer"
                                                value={category}
                                                onChange={e => setCategory(e.target.value)}
                                            >
                                                <option value="CRYPTO">CRYPTO</option>
                                                <option value="SPORTS">SPORTS</option>
                                                <option value="POLITICS">POLITICS</option>
                                                <option value="POP">POP_CULTURE</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest italic flex items-center gap-1">
                                                <Calendar size={10} /> EXPIRY_DATE
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full bg-white border-2 border-black px-4 py-3 text-black font-black uppercase tracking-tighter text-sm focus:bg-orange-50 focus:outline-none cursor-pointer"
                                                value={endDate}
                                                onChange={e => setEndDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!withinLimit}
                                        className={`w-full font-black py-4 border-2 border-black transition-all mt-4 uppercase tracking-widest text-xs italic ${withinLimit
                                            ? 'bg-orange-600 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none'
                                            : 'bg-gray-100 text-black/20 cursor-not-allowed grayscale'
                                            }`}
                                    >
                                        {withinLimit ? 'EXECUTE_DEPLOYMENT_🚀' : '⏳_LIMIT_ACTIVE_THROTTLE'}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Footer Ticker */}
                        <div className="bg-black py-2 px-4 overflow-hidden border-t-2 border-black">
                            <div className="whitespace-nowrap flex gap-8 animate-infinite-scroll">
                                {[...Array(3)].map((_, i) => (
                                    <span key={i} className="text-[8px] font-mono font-black text-white/40 uppercase tracking-[0.2em]">
                                        POLYPREDICT_TERMINAL_V0.1 // VERIFIED_WHALE_CREATION_MODE_ACTIVE // SOLANA_MAINNET_FEED_STABLE
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </AnimatePresence>
    );
};
