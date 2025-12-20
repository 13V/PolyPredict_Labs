'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Share2, Copy } from 'lucide-react';

interface BetDetails {
    amount: number;
    outcome: 'yes' | 'no';
    question: string;
    payoutMultiplier?: number;
}

interface BetSuccessContextType {
    showBetSuccess: (details: BetDetails) => void;
}

const BetSuccessContext = createContext<BetSuccessContextType | undefined>(undefined);

export function BetSuccessProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [details, setDetails] = useState<BetDetails | null>(null);
    const [copied, setCopied] = useState(false);

    const showBetSuccess = (betDetails: BetDetails) => {
        setDetails(betDetails);
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => setDetails(null), 300); // Clear after animation
    };

    const handleShare = () => {
        if (!details) return;
        const text = `I just bet $${details.amount} on ${details.outcome.toUpperCase()} for "${details.question}" on Polybet! 🔮`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <BetSuccessContext.Provider value={{ showBetSuccess }}>
            {children}
            <AnimatePresence>
                {isOpen && details && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
                        >
                            {/* Glow Effect */}
                            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${details.outcome === 'yes' ? 'via-green-500' : 'via-red-500'} to-transparent opacity-50`} />

                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-6">

                                {/* Minimalist Checkmark Animation */}
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${details.outcome === 'yes' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
                                    >
                                        <Check size={32} strokeWidth={4} />
                                    </motion.div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white">Position Secured</h3>
                                    <p className="text-sm text-gray-400 line-clamp-2">{details.question}</p>
                                </div>

                                <div className="w-full bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Outcome</span>
                                        <span className={`font-bold uppercase ${details.outcome === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                                            {details.outcome}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Staked</span>
                                        <span className="text-white font-mono font-bold">${details.amount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="flex-1 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {copied ? <Check size={16} /> : <Share2 size={16} />}
                                        {copied ? 'Copied' : 'Share'}
                                    </button>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </BetSuccessContext.Provider>
    );
}

export function useBetSuccess() {
    const context = useContext(BetSuccessContext);
    if (!context) {
        throw new Error('useBetSuccess must be used within a BetSuccessProvider');
    }
    return context;
}
