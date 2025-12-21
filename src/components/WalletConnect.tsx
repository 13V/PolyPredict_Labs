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
            <WalletMultiButton className="!bg-black !text-white !border-2 !border-black hover:!bg-orange-600 !transition-all !rounded-none !font-mono !font-black !text-[10px] md:!text-xs !h-auto !py-2 md:!py-3 !px-4 md:!px-8 !whitespace-nowrap !italic !uppercase !tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        </div>
    );
};
