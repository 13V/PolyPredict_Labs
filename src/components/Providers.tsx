'use client';
import { FC, ReactNode, useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

// Polyfills for Solana Web3.js support on client
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
    if (!window.Buffer) window.Buffer = Buffer;
    if (!window.process) {
        // @ts-ignore
        window.process = { env: {} };
    }
}

import { BetSuccessProvider } from '@/context/BetSuccessContext';
import { ToastProvider } from '@/context/ToastContext';

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const network = WalletAdapterNetwork.Mainnet;

    // Redundant RPC Endpoint List
    const endpoint = useMemo(() => {
        if (process.env.NEXT_PUBLIC_RPC_URL) return process.env.NEXT_PUBLIC_RPC_URL;
        // Using a more official/alternative public node if the primary is throttled
        return 'https://api.mainnet-beta.solana.com';
    }, []);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
            <WalletProvider
                wallets={wallets}
                autoConnect={mounted} // Only auto-connect after client is mounted
                onError={(error) => console.error("WalletProvider Error:", error)}
            >
                <WalletModalProvider>
                    <ToastProvider>
                        <BetSuccessProvider>
                            {children}
                        </BetSuccessProvider>
                    </ToastProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

