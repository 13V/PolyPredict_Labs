'use client';
import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

// Dynamically import WalletMultiButton to avoid hydration errors
const WalletMultiButton = dynamic(
    () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
    { ssr: false }
);

export const WalletConnect: FC = () => {
    const [mounted, setMounted] = useState(false);
    const { connected, connecting, wallet, publicKey } = useWallet();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (connecting) console.log("Wallet adapter attempting connection...", wallet?.adapter.name);
        if (connected) console.log("Wallet connected successfully:", publicKey?.toString());
    }, [connecting, connected, wallet, publicKey]);

    if (!mounted) return null;

    return (
        <div className="z-50 relative group">
            <WalletMultiButton className="!bg-black !text-white !border-2 !border-black hover:!bg-orange-600 !transition-all !rounded-none !font-mono !font-black !text-[10px] md:!text-xs !h-auto !py-2 md:!py-3 !px-4 md:!px-8 !whitespace-nowrap !italic !uppercase !tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
            {connecting && (
                <div className="absolute top-full left-0 mt-2 px-2 py-1 bg-black text-white text-[8px] font-black uppercase italic animate-pulse">
                    SIGNAL_ATTEMPTING_SYNC...
                </div>
            )}
        </div>
    );
};
