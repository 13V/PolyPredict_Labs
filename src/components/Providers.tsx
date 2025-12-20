'use client';
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

// Polyfill Buffer for Solana Web3.js support on client
import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
}

import { BetSuccessProvider } from '@/context/BetSuccessContext';
import { ToastProvider } from '@/context/ToastContext';

// ...

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Mainnet;

    // Use environment variable for RPC or fallback to a resilient public one
    const endpoint = useMemo(() =>
        process.env.NEXT_PUBLIC_RPC_URL || 'https://solana-mainnet.rpc.extrnode.com',
        []);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
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

