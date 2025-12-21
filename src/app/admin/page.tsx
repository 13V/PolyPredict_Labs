'use client';
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
    calculateRewards,
    calculateAllRewards,
    downloadRewardsCSV
} from '@/utils/rewardCalculation';

// Admin wallet addresses
const ADMIN_WALLETS = [
    'FUy2dxo5ZF2WhvRunw8fq8Nau3GX3NFis8AgYavxASX2', // Dev Wallet
];

import { dailyPredictions } from '@/data/predictions';

const predictions = dailyPredictions;

export default function AdminPage() {
    const { publicKey, connected } = useWallet();
    const [isAdmin, setIsAdmin] = useState(false);
    const [outcomes, setOutcomes] = useState<any[]>([]);
    const [allRewards, setAllRewards] = useState<any[]>([]);
    const [totalVotes, setTotalVotes] = useState(0);

    useEffect(() => {
        if (publicKey) {
            // Check if connected wallet is an admin
            const isAdminWallet = ADMIN_WALLETS.includes(publicKey.toString());
            setIsAdmin(isAdminWallet);
        }

        // Load data
        loadData();
    }, [publicKey]);

    const loadData = () => {
        setOutcomes(getAllOutcomes());
        setAllRewards(calculateAllRewards(1000)); // 1000 $PREDICT per prediction
        setTotalVotes(getAllVotes().length);
    };

    const handleClosePrediction = (predictionId: number, outcome: 'yes' | 'no') => {
        if (!publicKey) return;

        const confirmed = window.confirm(
            `Are you sure you want to close this prediction with outcome: ${outcome.toUpperCase()}?`
        );

        if (confirmed) {
            closePrediction(predictionId, outcome, publicKey.toString());
            loadData();
        }
    };

    const handleReopenPrediction = (predictionId: number) => {
        const confirmed = window.confirm('Are you sure you want to reopen this prediction?');

        if (confirmed) {
            reopenPrediction(predictionId);
            loadData();
        }
    };

    const handleDownloadRewards = () => {
        downloadRewardsCSV();
    };

    // Wallet Connection Check Removed - Allowing offline access for Key Deriver

    const totalRewardPool = allRewards.reduce((sum, r) => sum + r.totalRewardPool, 0);
    const totalWinners = allRewards.reduce((sum, r) => sum + r.totalWinners, 0);

    return (
        <div className="min-h-screen bg-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-black uppercase tracking-tighter italic">POLYPREDICT_ADMIN</h1>
                        <p className="text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest">PROPHET_PROTOCOL // MANAGEMENT_CONSOLE</p>
                    </div>
                    <WalletConnect />
                </div>

                {(!connected || !isAdmin) && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8 flex items-center gap-3">
                        <Lock className="w-5 h-5 text-yellow-500" />
                        <div>
                            <h3 className="font-bold text-yellow-500">Restricted Access</h3>
                            <p className="text-sm text-yellow-200/70">
                                {!connected ? "Wallet not connected. " : "Not logged in as Admin. "}
                                You can only use the Developer Tools below.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats - HIDDEN IF NOT ADMIN */}
                {isAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6"
                        >
                            <Users className="w-8 h-8 text-purple-400 mb-2" />
                            <div className="text-3xl font-bold text-white">{totalVotes}</div>
                            <div className="text-sm text-gray-400">Total Votes</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-6"
                        >
                            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                            <div className="text-3xl font-bold text-white">{outcomes.length}</div>
                            <div className="text-sm text-gray-400">Closed Predictions</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-6"
                        >
                            <TrendingUp className="w-8 h-8 text-blue-400 mb-2" />
                            <div className="text-3xl font-bold text-white">{totalWinners}</div>
                            <div className="text-sm text-gray-400">Total Winners</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl p-6"
                        >
                            <DollarSign className="w-8 h-8 text-orange-600 mb-2" />
                            <div className="text-3xl font-black text-black">{totalRewardPool.toLocaleString()}</div>
                            <div className="text-sm font-black text-black/40 uppercase tracking-widest">$PREDICT_REWARDS</div>
                        </motion.div>
                    </div>
                )}

                {/* Export Button - HIDDEN IF NOT ADMIN */}
                {isAdmin && (
                    <div className="mb-8 flex gap-4">
                        <button
                            onClick={handleDownloadRewards}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Export Rewards CSV
                        </button>
                    </div>
                )}

                {/* Developer Tools (Key Deriver) - ALWAYS VISIBLE */}
                <div className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-yellow-500" />
                        Developer Tools: Key Deriver
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Secret Key JSON (Paste content of program-keypair.json)</label>
                            <textarea
                                id="sk-input"
                                className="w-full h-24 bg-black/40 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 focus:border-purple-500 outline-none"
                                placeholder="[123, 45, 67, ...]"
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <button
                                onClick={() => {
                                    try {
                                        const input = (document.getElementById('sk-input') as HTMLTextAreaElement).value;
                                        const secretKey = Uint8Array.from(JSON.parse(input));
                                        const { Keypair } = require('@solana/web3.js'); // Lazy load to avoid SSR issues if any
                                        const kp = Keypair.fromSecretKey(secretKey);
                                        alert(`Public Key: ${kp.publicKey.toString()}`);
                                        console.log("Derived Public Key:", kp.publicKey.toString());
                                    } catch (e: any) {
                                        alert("Error deriving key: " + e.message);
                                    }
                                }}
                                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg font-bold text-white transition-all mb-2"
                            >
                                Calculate Public Key
                            </button>
                            <p className="text-xs text-gray-500">
                                This runs entirely in your browser. The key is not sent anywhere.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Predictions List - HIDDEN IF NOT ADMIN */}
                {isAdmin && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4">Manage Predictions</h2>

                        {predictions.map((prediction, index) => {
                            const isClosed = isPredictionClosed(prediction.id);
                            const outcome = outcomes.find(o => o.predictionId === prediction.id);
                            const rewardData = allRewards.find(r => r.predictionId === prediction.id);

                            return (
                                <motion.div
                                    key={prediction.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-gradient-to-br from-gray-900 to-gray-950 border rounded-xl p-6 ${isClosed ? 'border-green-500/30' : 'border-gray-800'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm font-semibold text-purple-400">#{prediction.id}</span>
                                                {isClosed && (
                                                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-semibold text-green-400">
                                                        CLOSED - {outcome?.outcome.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">{prediction.question}</h3>

                                            {rewardData && (
                                                <div className="text-[10px] font-mono font-bold text-black/40 uppercase">
                                                    WINNERS: {rewardData.totalWinners} | REWARD_PER_NODE: {rewardData.rewardPerWinner.toFixed(2)} $PREDICT
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {!isClosed ? (
                                                <>
                                                    <button
                                                        onClick={() => handleClosePrediction(prediction.id, 'yes')}
                                                        className="px-4 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-500/30 rounded-lg text-green-400 font-semibold transition-all flex items-center gap-2"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Close YES
                                                    </button>
                                                    <button
                                                        onClick={() => handleClosePrediction(prediction.id, 'no')}
                                                        className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 rounded-lg text-red-400 font-semibold transition-all flex items-center gap-2"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Close NO
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleReopenPrediction(prediction.id)}
                                                    className="px-4 py-2 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-500/30 rounded-lg text-yellow-400 font-semibold transition-all flex items-center gap-2"
                                                >
                                                    <Unlock className="w-4 h-4" />
                                                    Reopen
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
