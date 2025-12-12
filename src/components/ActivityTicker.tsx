'use client';

import { motion } from 'framer-motion';
import { TrendingUp, User } from 'lucide-react';

const RECENT_BETS = [
    { user: '0x3a...29b', action: 'bought YES', market: 'BTC > $100k', amount: '$500' },
    { user: '0x7e...44a', action: 'bought YES', market: 'DOGE to Moon', amount: '$50,000', isWhale: true },
    { user: '0x8f...1a2', action: 'bought NO', market: 'ETH > $4k', amount: '$1,200' },
    { user: '0xDb...21c', action: 'bought NO', market: 'Fed Rate Cut', amount: '$85,000', isWhale: true },
    { user: '0x1c...99d', action: 'bought YES', market: 'SOL Flips BNB', amount: '$250' },
    { user: '0x99...11f', action: 'bought YES', market: 'BTC > $100k', amount: '$150' },
    { user: '0xWh...ale', action: 'bought YES', market: 'Trump Win 2028', amount: '$1M', isWhale: true },
    { user: '0x44...8ab', action: 'bought YES', market: 'GTA 6 Trailer', amount: '$800' },
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
                        <div key={i} className={`flex items-center gap-2 text-xs ${bet.isWhale ? 'bg-purple-900/30 border border-purple-500/30 px-3 py-1 rounded-full mx-2' : 'text-gray-400'}`}>
                            {bet.isWhale && <span className="text-lg">🐋</span>}
                            <span className={`flex items-center gap-1 ${bet.isWhale ? 'text-purple-300 font-bold' : 'text-gray-500'}`}>
                                <User size={bet.isWhale ? 12 : 10} /> {bet.user}
                            </span>
                            <span className={bet.action.includes('YES') ? "text-green-400" : "text-red-400"}>
                                {bet.action}
                            </span>
                            <span className="text-white font-medium">{bet.market}</span>
                            <span className={`${bet.isWhale ? 'text-yellow-400 font-black' : 'text-gray-300'}`}>({bet.amount})</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
