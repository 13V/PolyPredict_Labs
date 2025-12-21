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
            label: "TERMINAL",
            icon: Home,
            action: onScrollTop
        },
        {
            label: "INTEL_HUB",
            icon: TrendingUp,
            action: onOpenSearch
        },
        {
            label: "PORTFOLIO",
            icon: Wallet,
            action: onOpenMyBets
        },
        {
            label: "SIGNAL",
            icon: UserIcon,
            action: () => { } // Profile handled elsewhere or placeholder
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[40] md:hidden">
            <div className="bg-black border-t-2 border-black pb-8 pt-3 px-6 safe-area-pb">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    {navItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.action}
                            className="flex flex-col items-center gap-1.5 group flex-1"
                        >
                            <div className="p-2 transition-transform group-active:scale-90">
                                <item.icon
                                    size={20}
                                    className={`transition-colors ${index === 2 && connected ? 'text-orange-500' : 'text-white'}`}
                                    strokeWidth={3}
                                />
                            </div>
                            <span className="text-[8px] font-black text-white/40 group-hover:text-white uppercase tracking-widest italic font-mono">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            {/* Corner decorator for the black bar to give it an industrial look */}
            <div className="absolute top-0 left-0 w-4 h-4 bg-orange-600 -translate-y-full border-t-2 border-r-2 border-black" />
        </div>
    );
};
