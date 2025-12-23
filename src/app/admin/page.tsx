'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnect } from '@/components/WalletConnect';
import { motion } from 'framer-motion';
import {
    Lock,
    Unlock,
    Download,
    TrendingUp,
    Users,
    DollarSign,
    CheckCircle,
    XCircle,
    Shield
} from 'lucide-react';
import { getAllVotes } from '@/utils/voteStorage';
import {
    closePrediction,
    getAllOutcomes,
    reopenPrediction,
    isPredictionClosed
} from '@/utils/predictionManagement';
import {
    calculateAllRewards,
    downloadRewardsCSV
} from '@/utils/rewardCalculation';
import {
    initializeProtocol,
    initializeMarketOnChain,
    getTreasuryVaultPDA,
    BETTING_MINT
} from '@/services/web3';
import { dailyPredictions } from '@/data/predictions';
import { fetchDailyMarkets } from '@/services/polymarket';
import { getProgram } from '@/services/web3';

// Admin wallet addresses
const ADMIN_WALLETS = [
    '2KF9SAvpU2h2ZhczzMLbgx7arkjG8QHCXbQ6XaDqtEtm', // User's Personal Phantom Wallet
    'riQLJeg8RLZkTCja6kPsHEnT2KwyL4maLPQ7f9JkFjW', // Dev/Treasury Wallet
];

const ADMIN_PASS = "PolyPredict2024!";

export default function AdminPage() {
    const { publicKey, connected } = useWallet();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState(false);

    const [onChainMarkets, setOnChainMarkets] = useState<any[]>([]);
    const [totalVotes, setTotalVotes] = useState(0);
    const [polyEvents, setPolyEvents] = useState<any[]>([]);
    const [isLoadingPoly, setIsLoadingPoly] = useState(false);
    const [treasuryVault, setTreasuryVault] = useState<string>('');
    const [vaultBalance, setVaultBalance] = useState<string>('0.00');
    const [protocolStatus, setProtocolStatus] = useState<'loading' | 'uninitialized' | 'active'>('loading');

    useEffect(() => {
        if (publicKey) {
            const isAdminWallet = ADMIN_WALLETS.includes(publicKey.toString());
            setIsAdmin(isAdminWallet);
        } else {
            setIsAdmin(false);
            setIsAuthenticated(false);
        }
        loadData();
        loadDiscoveryFeed();
        checkProtocol();
    }, [publicKey]);

    const loadDiscoveryFeed = async () => {
        setIsLoadingPoly(true);
        try {
            // 1. Fetch exactly what the home page sees
            const feed = await fetchDailyMarkets(50);
            setPolyEvents(feed);

            // 2. Fetch what's actually on chain
            const program = getProgram({ publicKey: null });
            if (program) {
                const accounts = await program.account.market.all();
                const mapped = accounts.map((a: any) => ({
                    address: a.publicKey.toString(),
                    id: a.account.marketId.toNumber(),
                    polymarketId: a.account.polymarketId
                }));
                setOnChainMarkets(mapped);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingPoly(false);
        }
    };

    const checkProtocol = async () => {
        try {
            const vault = await getTreasuryVaultPDA();
            setTreasuryVault(vault.toString());

            // Try to fetch balance if connection is available
            const { Connection } = await import('@solana/web3.js');
            const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

            try {
                const balance = await connection.getTokenAccountBalance(vault);
                setVaultBalance(balance.value.uiAmountString || '0.00');
            } catch (e) {
                // Account might not exist yet if not initialized
                setVaultBalance('0.00');
            }

            setProtocolStatus('active');
        } catch (e) {
            setProtocolStatus('uninitialized');
        }
    };

    const handleInitializeProtocol = async () => {
        if (!publicKey) return;
        try {
            const tx = await initializeProtocol(window.solana, BETTING_MINT);
            alert("Protocol Initialized! TX: " + tx);
            checkProtocol();
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const handleMirrorMarket = async (event: any) => {
        if (!publicKey) return;
        const confirmed = window.confirm(`Mirror "${event.question}" as a Daily market?\n\nThis will apply the "Reverse-Math" fix to ensure winning payouts match Polymarket odds exactly after our 10% Protocol Tax.`);
        if (!confirmed) return;

        try {
            // Reverse-Math for 90/10 Split:
            // We want (0.9 * Pot) / OutcomeTotal = TargetMultiplier
            // OutcomeTotal = (0.9 / TargetMultiplier) * Pot
            // So Weight = (0.9 / TargetMultiplier)

            const totalLiquidity = event.totals.reduce((a: number, b: number) => a + b, 0);
            const weights = event.totals.map((t: number) => {
                const probability = t / totalLiquidity;
                // TargetMultiplier = 1 / probability
                // Weight = 0.9 / (1/probability) = 0.9 * probability
                return Math.floor(probability * 900); // Scale to 1000 baselines
            });

            // Fill remaining weight slots with 0 if fewer than 8 outcomes
            const finalWeights = [...weights];
            while (finalWeights.length < 8) finalWeights.push(0);

            const tx = await initializeMarketOnChain(
                window.solana,
                event.question,
                event.endTime,
                event.outcomes.length,
                1000000,
                finalWeights as [number, number, number, number, number, number, number, number]
            );
            alert("Daily Market Mirrored with Fixed Odds! TX: " + tx);
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const loadData = () => {
        setTotalVotes(getAllVotes().length);
    };

    const handleClosePrediction = (predictionId: number, outcome: 'yes' | 'no') => {
        if (window.confirm(`Close prediction with outcome: ${outcome.toUpperCase()}?`)) {
            closePrediction(predictionId, outcome, publicKey?.toString() || "");
            loadData();
        }
    };

    const handleReopenPrediction = (predictionId: number) => {
        if (window.confirm('Reopen this prediction?')) {
            reopenPrediction(predictionId);
            loadData();
        }
    };

    // Placeholder for legacy reward calculation logic if needed in future
    const totalRewardPool = 0;
    const totalWinners = 0;

    return (
        <div className="min-h-screen bg-white p-6 md:p-12 text-black">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-12 border-b-4 border-black pb-8">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic">POLYPREDICT_ADMIN</h1>
                        <p className="text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest italic">PROTOCOL_AUTH_STATION // DAILY_FOCUS_ENABLED</p>
                    </div>
                    <WalletConnect />
                </div>

                {connected && isAdmin && !isAuthenticated && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto my-20 p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white text-center"
                    >
                        <Lock className="w-12 h-12 text-orange-600 mx-auto mb-6" />
                        <h2 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">SECURE_AUTH_REQUIRED</h2>
                        <p className="text-[10px] font-mono text-black/40 uppercase mb-8">Verification signal needed for station access</p>

                        <div className="space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
                                onKeyDown={(e) => e.key === 'Enter' && password === ADMIN_PASS && setIsAuthenticated(true)}
                                className={`w-full bg-gray-50 border-2 ${authError ? 'border-red-600' : 'border-black'} px-4 py-3 text-black font-black uppercase tracking-widest text-center focus:bg-orange-50 outline-none`}
                                placeholder="STATION_PASSPHRASE"
                            />
                            <button
                                onClick={() => {
                                    if (password === ADMIN_PASS) setIsAuthenticated(true);
                                    else setAuthError(true);
                                }}
                                className="w-full bg-black text-white font-black py-4 uppercase tracking-[0.2em] text-xs hover:bg-orange-600 transition-colors shadow-[4px_4px_0px_0px_rgba(255,165,0,1)]"
                            >
                                REQUEST_ACCESS
                            </button>
                        </div>
                    </motion.div>
                )}

                {connected && isAdmin && isAuthenticated && (
                    <div className="space-y-12">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:grid-cols-4 md:gap-6">
                            {[
                                { label: 'TOTAL_VOTES', val: totalVotes, icon: Users },
                                { label: 'ON_CHAIN_MARKETS', val: onChainMarkets.length, icon: CheckCircle },
                                { label: 'SIGNAL_FEED', val: polyEvents.length, icon: TrendingUp },
                                { label: 'ADMIN_ACCESS', val: 'VERIFIED', icon: Shield }
                            ].map((stat, i) => (
                                <div key={i} className="border-4 border-black p-4 md:p-6 bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                                    <stat.icon className="w-5 h-5 mb-3 text-orange-600" />
                                    <div className="text-xl md:text-3xl font-black tracking-tighter">{stat.val}</div>
                                    <div className="text-[8px] md:text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Protocol Management */}
                        <div className="border-4 border-black p-8 bg-gray-50">
                            <h2 className="text-2xl font-black uppercase italic mb-6 tracking-tighter flex items-center gap-3">
                                <Shield className="text-orange-600" /> PROTOCOL_RESERVES
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-mono font-bold text-black/40 uppercase">Treasury Vault (PDA)</label>
                                            <div className="text-xs font-mono font-black break-all bg-white border-2 border-black p-3 select-all cursor-pointer" title="Click to copy" onClick={() => { navigator.clipboard.writeText(treasuryVault); alert('Copied!'); }}>
                                                {treasuryVault || 'OFFLINE'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-mono font-bold text-black/40 uppercase">Current Balance</label>
                                            <div className="text-2xl font-black bg-white border-2 border-black p-2 text-center text-orange-600">
                                                {vaultBalance} <span className="text-[10px] opacity-40">PREDICT</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleInitializeProtocol}
                                        className="w-full bg-black text-white py-5 md:py-4 font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-orange-600 transition-colors active:scale-95"
                                    >
                                        Initialize Global Protocol
                                    </button>
                                </div>
                                <div className="space-y-4 text-[11px] font-mono font-bold text-black/60 uppercase p-4 border-2 border-dashed border-black/20">
                                    <p className="text-black font-black">⚠️ SEED LIQUIDITY WARNING:</p>
                                    <p>To initialize markets with "Virtual Liquidity" (e.g., matching a 1,000 token pot), you MUST send at least that amount to the **Treasury Vault address** above.</p>
                                    <p>If the vault is empty, winners will not be able to claim their payouts.</p>
                                </div>
                            </div>
                        </div>

                        {/* Market Discovery & Sync Hub */}
                        <div className="border-4 border-black p-8 bg-white">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">MARKET_SYNC_HUB</h2>
                                    <p className="text-[10px] font-mono font-bold text-black/40 uppercase">WEBSITE_LIVE_FEED // SYNC_STATUS_TRACKER</p>
                                </div>
                                <button onClick={loadDiscoveryFeed} className={`p-4 border-2 border-black hover:bg-orange-50 transition-colors ${isLoadingPoly ? 'animate-spin' : ''}`}>
                                    <TrendingUp size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {polyEvents.length > 0 ? (
                                    polyEvents.map((event) => {
                                        const hoursLeft = Math.max(0, (event.endTime * 1000 - Date.now()) / (1000 * 60 * 60));
                                        const isOnChain = onChainMarkets.some(m => m.polymarketId === event.polymarketId);

                                        return (
                                            <div key={event.id} className={`border-2 border-black p-5 relative overflow-hidden flex flex-col justify-between group ${isOnChain ? 'bg-orange-50/30' : 'bg-white'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {isOnChain ? (
                                                            <span className="bg-green-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest">LIVE_ON_CHAIN</span>
                                                        ) : (
                                                            <span className="bg-black text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest">READY_FOR_INIT</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[8px] font-black uppercase italic opacity-40">
                                                        ENDS: {hoursLeft.toFixed(1)}H
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <h4 className="font-black text-sm uppercase leading-tight pr-12">{event.question}</h4>
                                                    <div className="flex gap-2 mt-3">
                                                        {event.outcomes.map((o: string, idx: number) => (
                                                            <span key={idx} className="text-[9px] font-mono font-bold px-2 py-0.5 border border-black/10">
                                                                {o}: {(event.totals[idx] / Math.max(1, event.totals.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(0)}%
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {isOnChain ? (
                                                    <div className="w-full py-3 bg-gray-100 text-black/40 text-[10px] font-black uppercase tracking-widest text-center border-2 border-dashed border-black/10">
                                                        SYNC_COMPLETE
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleMirrorMarket(event)}
                                                        className="w-full py-4 md:py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors active:bg-orange-700"
                                                    >
                                                        INITIALIZE_ON_MAINNET
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-black/10">
                                        <p className="text-black font-black uppercase tracking-widest opacity-40 mb-2">No markets found in discovery feed</p>
                                        <p className="text-[10px] font-mono font-bold text-black/20 uppercase italic">Try refreshing or check CORS proxy status in logs</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Prediction Management */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">PREDICTION_COMMAND_LOG</h2>
                            <div className="space-y-4">
                                {dailyPredictions.map((prediction) => {
                                    const isClosed = isPredictionClosed(prediction.id);
                                    return (
                                        <div key={prediction.id} className={`border-2 border-black p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 ${isClosed ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-[10px] font-mono font-black text-black/40 uppercase">ID_{prediction.id}</span>
                                                    {isClosed && <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 uppercase italic">RESOLVED</span>}
                                                </div>
                                                <h3 className="font-black text-sm uppercase leading-tight">{prediction.question}</h3>
                                            </div>
                                            <div className="grid grid-cols-2 md:flex gap-3 md:gap-2">
                                                {!isClosed ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleClosePrediction(prediction.id, 'yes')}
                                                            className="px-4 py-4 md:py-2 border-2 border-black font-black text-[10px] uppercase hover:bg-green-50 active:bg-green-100"
                                                        >
                                                            YES
                                                        </button>
                                                        <button
                                                            onClick={() => handleClosePrediction(prediction.id, 'no')}
                                                            className="px-4 py-4 md:py-2 border-2 border-black font-black text-[10px] uppercase hover:bg-red-50 active:bg-red-100"
                                                        >
                                                            NO
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReopenPrediction(prediction.id)}
                                                        className="col-span-2 px-4 py-4 md:py-2 border-2 border-black font-black text-[10px] uppercase hover:bg-orange-50"
                                                    >
                                                        REOPEN_SIG
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-12 text-center">
                            <button onClick={downloadRewardsCSV} className="text-[10px] font-mono font-black text-black/40 uppercase underline hover:text-black">EXPORT_MASTER_LOG_CSV</button>
                        </div>
                    </div>
                )}

                {(!connected || !isAdmin) && (
                    <div className="max-w-md mx-auto my-20 p-12 border-4 border-dashed border-black/20 text-center">
                        <Lock className="w-12 h-12 text-black/20 mx-auto mb-6" />
                        <h2 className="text-xl font-black uppercase italic text-black/40 tracking-tighter">UNAUTHORIZED_ACCESS</h2>
                        <p className="text-[10px] font-mono text-black/20 uppercase mt-2">Connect protocol authority wallet to engage console</p>
                    </div>
                )}
            </div>
        </div>
    );
}
