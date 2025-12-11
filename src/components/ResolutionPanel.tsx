'use client';
import { useState } from 'react';
import { Check, X, ShieldCheck, Trophy } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { hasMinimumTokens } from '@/utils/tokenGating';
import { saveResolution } from '@/utils/voteStorage';

interface ResolutionPanelProps {
    id: number;
    yesLabel: string;
    noLabel: string;
    onResolve: (outcome: 'yes' | 'no') => void;
}

export const ResolutionPanel = ({ id, yesLabel, noLabel, onResolve }: ResolutionPanelProps) => {
    const { connected, publicKey } = useWallet();
    const [selected, setSelected] = useState<'yes' | 'no' | null>(null);
    const [isStaking, setIsStaking] = useState(false);
    const [hasStaked, setHasStaked] = useState(false);

    const STAKE_AMOUNT = 500;

    const handleStake = async () => {
        if (!selected || !publicKey) return;

        setIsStaking(true);

        // Simulate checking balance and staking transaction
        const hasFunds = await hasMinimumTokens(publicKey.toString(), STAKE_AMOUNT);

        if (!hasFunds) {
            alert(`Insufficient Balance! You need ${STAKE_AMOUNT} PROPHET to verify.`);
            setIsStaking(false);
            return;
        }

        // ... (inside component)

        // Simulate network delay
        setTimeout(() => {
            saveResolution({
                predictionId: id,
                outcome: selected,
                timestamp: Date.now(),
                stakedAmount: STAKE_AMOUNT
            });
            setHasStaked(true);
            setIsStaking(false);
            onResolve(selected);
        }, 1500);
    };

    if (hasStaked) {
        return (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center animate-in fade-in zoom-in">
                <div className="flex justify-center mb-2">
                    <ShieldCheck className="text-blue-400 w-8 h-8" />
                </div>
                <h4 className="text-blue-400 font-bold mb-1">Verification Cast!</h4>
                <p className="text-xs text-blue-300/80">
                    You staked {STAKE_AMOUNT} PROPHET on <strong>{selected === 'yes' ? yesLabel : noLabel}</strong>.
                </p>
                <div className="mt-2 text-[10px] text-gray-500 uppercase tracking-wider">
                    Reward Distribution in 24h
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 border border-blue-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-3">
                <Trophy size={14} className="text-blue-500" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Verify Outcome
                </span>
                <span className="ml-auto text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                    Stake {STAKE_AMOUNT}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                    onClick={() => setSelected('yes')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${selected === 'yes'
                        ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                        : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                        }`}
                >
                    <Check size={14} /> {yesLabel}
                </button>
                <button
                    onClick={() => setSelected('no')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${selected === 'no'
                        ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                        : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                        }`}
                >
                    <X size={14} /> {noLabel}
                </button>
            </div>

            <button
                disabled={!selected || isStaking || !connected}
                onClick={handleStake}
                className={`w-full py-2 rounded-lg font-bold text-xs transition-all ${!selected
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : isStaking
                        ? 'bg-blue-900 text-blue-300 cursor-wait'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                    }`}
            >
                {isStaking ? 'Verifying...' : !connected ? 'Connect Wallet' : `Confirm & Stake ${STAKE_AMOUNT}`}
            </button>
        </div>
    );
};
