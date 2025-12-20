'use client';

import { motion } from 'framer-motion';
import { TrendingUp, User } from 'lucide-react';

const RECENT_BETS = [
    { user: '0x3a...29b', action: 'voted YES', market: 'BTC > $100k', amount: '5,000 $POLYBET' },
    { user: '0x7e...44a', action: 'voted YES', market: 'SOL to $500', amount: '25,000 $POLYBET', isWhale: true },
    { user: '0x8f...1a2', action: 'voted NO', market: 'ETH > $4k', amount: '2,500 $POLYBET' },
    { user: '0xDb...21c', action: 'voted NO', market: 'S&P 500 ATH', amount: '100,000 $POLYBET', isWhale: true },
    { user: '0x1c...99d', action: 'voted YES', market: 'Memecoin Season', amount: '1,200 $POLYBET' },
    { user: '0x99...11f', action: 'created market', market: 'Mars Landing 2030', isNew: true },
    { user: '0xWh...ale', action: 'voted YES', market: 'Trump Election', amount: '1M $POLYBET', isWhale: true },
    { user: '0x44...8ab', action: 'voted YES', market: 'GTA 6 Release', amount: '8,000 $POLYBET' },
];

export const ActivityTicker = () => {
    return (
        <div className="w-full bg-gray-950/20 backdrop-blur-md border-b border-white/5 overflow-hidden py-2.5 flex items-center">
            <div className="bg-white/5 border border-white/10 text-white text-[10px] font-black px-2 py-0.5 mx-4 rounded-sm flex items-center gap-2 tracking-[0.2em] uppercase shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                Live Feed
            </div>

            <div className="relative flex overflow-x-hidden flex-1 mask-linear-fade">
                <motion.div
                    className="flex gap-12 whitespace-nowrap items-center"
                    animate={{ x: [0, -1200] }}
                    transition={{
                        repeat: Infinity,
                        duration: 40,
                        ease: "linear"
                    }}
                >
                    {[...RECENT_BETS, ...RECENT_BETS, ...RECENT_BETS].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-[10px] text-gray-400">
                                    <User size={10} />
                                </div>
                                <span className="text-[11px] font-mono text-gray-500">{item.user}</span>
                            </div>

                            <span className={`text-[11px] font-bold uppercase tracking-tight ${item.isNew ? 'text-blue-400' :
                                item.action.includes('YES') ? 'text-cyan-400' : 'text-rose-400'
                                }`}>
                                {item.action}
                            </span>

                            <span className="text-[11px] font-bold text-white max-w-[150px] truncate">
                                {item.market}
                            </span>

                            {item.amount && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${item.isWhale ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'bg-white/5 text-gray-400'
                                    }`}>
                                    {item.amount}
                                </span>
                            )}

                            {item.isWhale && (
                                <span className="text-[11px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 animate-pulse font-black italic">
                                    WHALE ALERT 🐋
                                </span>
                            )}

                            {item.isNew && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold uppercase">
                                    New Market
                                </span>
                            )}
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
