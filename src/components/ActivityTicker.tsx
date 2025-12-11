'use client';

import { motion } from 'framer-motion';
import { TrendingUp, User } from 'lucide-react';

const RECENT_BETS = [
    { user: '0x3a...29b', action: 'bought YES', market: 'BTC > $100k', amount: '$500' },
    { user: '0x8f...1a2', action: 'bought NO', market: 'ETH > $4k', amount: '$1,200' },
    { user: '0x1c...99d', action: 'bought YES', market: 'SOL Flips BNB', amount: '$250' },
    { user: '0x7e...44a', action: 'bought YES', market: 'DOGE to Moon', amount: '$5,000' },
    { user: '0xDb...21c', action: 'bought NO', market: 'Fed Rate Cut', amount: '$3,100' },
    { user: '0x44...8ab', action: 'bought YES', market: 'GTA 6 Trailer', amount: '$800' },
    { user: '0x99...11f', action: 'bought YES', market: 'BTC > $100k', amount: '$150' },
    { user: '0x22...33a', action: 'bought NO', market: 'Taylor Swift Single', amount: '$420' },
];

export const ActivityTicker = () => {
    return (
        <div className="w-full bg-gray-950 border-b border-gray-800 overflow-hidden py-2 flex items-center">
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2 py-1 mx-4 rounded flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                LIVE
            </div>

            <div className="relative flex overflow-x-hidden flex-1 mask-linear-fade">
                <motion.div
                    className="flex gap-8 whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        duration: 30,
                        ease: "linear"
                    }}
                >
                    {[...RECENT_BETS, ...RECENT_BETS, ...RECENT_BETS].map((bet, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1 text-gray-500">
                                <User size={10} /> {bet.user}
                            </span>
                            <span className={bet.action.includes('YES') ? "text-green-400" : "text-red-400"}>
                                {bet.action}
                            </span>
                            <span className="text-white font-medium">{bet.market}</span>
                            <span className="text-gray-300">({bet.amount})</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
