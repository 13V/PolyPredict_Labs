'use client';
import { FC, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import WalletMultiButton to avoid hydration errors
const WalletMultiButton = dynamic(
    () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
    { ssr: false }
);

export const WalletConnect: FC = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="z-50 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <WalletMultiButton className="!bg-[#0f172a] !border !border-white/10 hover:!border-purple-500/50 !transition-all !rounded-xl !font-outfit !font-bold !text-sm !h-11 !px-6" />
        </div>
    );
};
