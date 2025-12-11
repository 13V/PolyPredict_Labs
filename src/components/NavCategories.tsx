'use client';

import { motion } from 'framer-motion';
import { Newspaper, Coins, Trophy, Globe, Zap, CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All Markets', icon: Zap },
    { id: 'crypto', label: 'Crypto', icon: Coins },
    { id: 'politics', label: 'Politics', icon: Globe },
    { id: 'sports', label: 'Sports', icon: Trophy },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle2 },
];

export const NavCategories = ({ active = 'all', onSelect }: { active?: string, onSelect?: (id: string) => void }) => {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide py-4">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onSelect && onSelect(cat.id)}
                    className={`
                        relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                        ${active === cat.id
                            ? 'text-white bg-gray-800 border border-gray-700 shadow-lg shadow-purple-900/10'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent'
                        }
                    `}
                >
                    {active === cat.id && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gray-800 rounded-full border border-purple-500/30 -z-10"
                        />
                    )}
                    <cat.icon size={14} className={active === cat.id ? "text-purple-400" : ""} />
                    {cat.label}
                </button>
            ))}
        </div>
    );
};
