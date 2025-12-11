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

// Admin wallet addresses (replace with your actual admin wallet)
const ADMIN_WALLETS = [
    'REPLACE_WITH_YOUR_ADMIN_WALLET_ADDRESS',
    // Add more admin wallets here
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
        setAllRewards(calculateAllRewards(1000)); // 1000 $PROPHET per prediction
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

    if (!connected) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-4">Admin Panel</h1>
                    <p className="text-gray-400 mb-6">Connect your wallet to access admin features</p>
                    <WalletConnect />
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-gray-400">This wallet is not authorized to access the admin panel.</p>
                </div>
            </div>
        );
    }

    const totalRewardPool = allRewards.reduce((sum, r) => sum + r.totalRewardPool, 0);
    const totalWinners = allRewards.reduce((sum, r) => sum + r.totalWinners, 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">PROPHET Admin Panel</h1>
                        <p className="text-gray-400">Manage predictions and calculate rewards</p>
                    </div>
                    <WalletConnect />
                </div>

                {/* Stats */}
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
                        <DollarSign className="w-8 h-8 text-yellow-400 mb-2" />
                        <div className="text-3xl font-bold text-white">{totalRewardPool.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">$PROPHET Rewards</div>
                    </motion.div>
                </div>

                {/* Export Button */}
                <div className="mb-8">
                    <button
                        onClick={handleDownloadRewards}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Export Rewards CSV
                    </button>
                </div>

                {/* Predictions List */}
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
                                            <div className="text-sm text-gray-400">
                                                Winners: {rewardData.totalWinners} | Reward per winner: {rewardData.rewardPerWinner.toFixed(2)} $PROPHET
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
            </div>
        </div>
    );
}
