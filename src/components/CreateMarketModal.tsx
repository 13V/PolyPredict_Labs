'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Unlock, Rocket, Calendar, Tag } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { saveUserMarket } from '@/utils/marketStorage';
import { hasMinimumTokens, getTokenBalance } from '@/utils/tokenGating';

interface CreateMarketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CREATION_THRESHOLD = 100000; // 100k PROPHET to create

export const CreateMarketModal = ({ isOpen, onClose }: CreateMarketModalProps) => {
    const { publicKey } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [eligible, setEligible] = useState(false);
    // Variants for responsive animation
    const modalVariants = {
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

    const checkEligibility = async () => {
        if (!publicKey) return;
        setIsLoading(true);
        try {
            const bal = await getTokenBalance(publicKey.toString());
            setBalance(bal);
            setEligible(bal >= CREATION_THRESHOLD);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();

        const newMarket = {
            id: Date.now(), // Simple unique ID
            category,
            question,
            timeLeft: 'Ends ' + new Date(endDate).toLocaleDateString(),
            endDate: new Date(endDate).toISOString(),
            yesVotes: 1, // Start with 1 vote each to avoid /0
            noVotes: 1,
            totalVolume: 100, // Initial liquidity
            isHot: true, // New markets are hot!
            status: 'active' as const
        };

        saveUserMarket(newMarket);

        alert("Market Successfully Created on Protocol! 🚀");
        onClose();
        window.location.reload(); // Simple reload to show new market
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={`fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                {isOpen && (
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-md bg-gray-900 border-t md:border border-gray-800 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    >
                        {/* Mobile Drag Handle */}
                        <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <Rocket className="text-purple-500" />
                                Create Market
                            </h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-gray-400 text-sm">Checking whale status...</p>
                                </div>
                            ) : !eligible ? (
                                // LOCKED STATE
                                <div className="text-center py-8">
                                    <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Lock size={40} className="text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Whales Only</h3>
                                    <p className="text-gray-400 mb-6 max-w-[80%] mx-auto">
                                        You need <strong>{CREATION_THRESHOLD.toLocaleString()} $PROPHET</strong> to create new prediction markets on the protocol.
                                    </p>
                                    <div className="bg-gray-800 rounded-lg p-4 inline-block border border-gray-700">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Your Balance</p>
                                        <p className="text-2xl font-mono text-white">
                                            {balance !== null ? balance.toLocaleString() : '0'} PROPHET
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                // UNLOCKED FORM
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg flex items-center gap-3 mb-6">
                                        <Unlock size={20} className="text-green-500" />
                                        <div>
                                            <p className="text-sm font-bold text-green-400">Access Granted</p>
                                            <p className="text-xs text-green-500/80">You hold {balance?.toLocaleString()} PROPHET</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            Pump.fun Token Address (Utility Locked)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. HqQq...pump (Optional)"
                                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors font-mono text-sm"
                                            value={mintConf}
                                            onChange={e => setMintConf(e.target.value)}
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            If set, only holders of this specific Pump.fun token can bet.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Will Bitcoin hit $100k this week?"
                                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                                            value={question}
                                            onChange={e => setQuestion(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                <div className="flex items-center gap-1"><Tag size={12} /> Category</div>
                                            </label>
                                            <select
                                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                                value={category}
                                                onChange={e => setCategory(e.target.value)}
                                            >
                                                <option value="CRYPTO">Crypto</option>
                                                <option value="SPORTS">Sports</option>
                                                <option value="POLITICS">Politics</option>
                                                <option value="POP">Pop Culture</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                <div className="flex items-center gap-1"><Calendar size={12} /> End Date</div>
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                                value={endDate}
                                                onChange={e => setEndDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/20 transition-all mt-4"
                                    >
                                        🚀 Launch Market
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </AnimatePresence>
    );
};
