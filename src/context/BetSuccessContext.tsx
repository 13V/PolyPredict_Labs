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
        const text = `I just committed $${details.amount} to ${details.outcome.toUpperCase()} for "${details.question}" on PolyPredict. The signal is live. ⚡`;
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="absolute inset-0 bg-white/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-sm bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-2 h-full bg-orange-600" />

                            <button
                                onClick={handleClose}
                                className="absolute top-6 right-6 text-black hover:scale-110 transition-transform font-black"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-8">
                                <div className="p-4 bg-black text-white">
                                    <Check size={32} strokeWidth={4} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black">POSITION_SECURED</h3>
                                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-relaxed px-4">{details.question}</p>
                                </div>

                                <div className="w-full border-2 border-black p-5 space-y-4 bg-gray-50">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-black/40">NODE_OUTCOME</span>
                                        <span className={`px-2 py-0.5 ${details.outcome === 'yes' ? 'bg-black text-white italic' : 'bg-orange-600 text-white italic'}`}>
                                            {details.outcome}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-t border-black/10 pt-4">
                                        <span className="text-black/40">STAKE_VALUE</span>
                                        <span className="text-black font-mono">${details.amount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full">
                                    <button
                                        onClick={handleShare}
                                        className="w-full py-4 bg-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] italic hover:bg-black transition-colors flex items-center justify-center gap-3"
                                    >
                                        {copied ? <Check size={16} strokeWidth={3} /> : <Share2 size={16} strokeWidth={3} />}
                                        {copied ? 'SIGNAL_COPIED' : 'EXFILTRATE_REPORT'}
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className="w-full py-4 border-2 border-black bg-white text-black font-black text-xs uppercase tracking-[0.2em] italic hover:bg-gray-100 transition-colors"
                                    >
                                        RETURN_TO_TERMINAL
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </BetSuccessContext.Provider>
    );
};

export function useBetSuccess() {
    const context = useContext(BetSuccessContext);
    if (!context) {
        throw new Error('useBetSuccess must be used within a BetSuccessProvider');
    }
    return context;
}
