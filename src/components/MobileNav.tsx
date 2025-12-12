'use client';
import { Home, Search, Wallet, User as UserIcon, TrendingUp } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';

// Simple "Active" state checker would go here ideally 
// For now we just provide the buttons that scroll or open modals

interface MobileNavProps {
    onOpenSearch: () => void;
    onOpenMyBets: () => void;
    onScrollTop: () => void;
}

export const MobileNav = ({ onOpenSearch, onOpenMyBets, onScrollTop }: MobileNavProps) => {
    const { connected } = useWallet();

    const navItems = [
        {
            label: "Home",
            icon: Home,
            action: onScrollTop
        },
        {
            label: "Predict",
            icon: TrendingUp,
            action: onOpenSearch // Actually "Explore" / Search categories
        },
        {
            label: "My Bets",
            icon: Wallet,
            action: onOpenMyBets
        },
        {
            label: "Profile",
            icon: UserIcon,
            action: () => alert("User Profile Coming Soon") // Placeholder
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[40] md:hidden">
            {/* Gradient Fade above bar */}
            <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />

            <div className="bg-gray-950/90 backdrop-blur-xl border-t border-white/10 pb-6 pt-2 px-6 safe-area-pb">
                <div className="flex justify-between items-center">
                    {navItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.action}
                            className="flex flex-col items-center gap-1 group w-16"
                        >
                            <div className="p-2 rounded-xl group-active:scale-95 transition-transform group-hover:bg-white/5">
                                <item.icon
                                    size={24}
                                    className={`transition-colors ${index === 2 && connected ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'}`}
                                    strokeWidth={2}
                                />
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-300">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
