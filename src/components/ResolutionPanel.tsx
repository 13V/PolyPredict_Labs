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
            alert(`INSUFFICIENT_FUNDS: Required ${STAKE_AMOUNT} $PREDICT for validation commit.`);
            setIsStaking(false);
            return;
        }

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
            <div className="bg-black text-white border-2 border-black p-6 text-center animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-center mb-4">
                    <ShieldCheck className="text-orange-500 w-8 h-8" strokeWidth={3} />
                </div>
                <h4 className="text-xl font-black uppercase italic tracking-tighter mb-2 leading-none">SIGNAL_COMMITTED</h4>
                <p className="text-[10px] uppercase font-black tracking-widest leading-relaxed">
                    COMMITTED {STAKE_AMOUNT} $PREDICT TO <strong>{selected === 'yes' ? yesLabel : noLabel}</strong>.
                </p>
                <div className="mt-4 pt-4 border-t border-white/20 text-[8px] font-black uppercase tracking-[0.3em] opacity-40">
                    NETWORK_SETTLEMENT_EXPECTED: 24H
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-black p-4 space-y-4">
            <div className="flex items-center gap-3">
                <Trophy size={16} className="text-black" strokeWidth={3} />
                <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] italic">
                    OUTCOME_VERIFICATION
                </span>
                <span className="ml-auto text-[10px] font-black bg-black text-white px-2 py-0.5 italic">
                    STAKE: {STAKE_AMOUNT}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-0 border-2 border-black">
                <button
                    onClick={() => setSelected('yes')}
                    className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest border-r-2 border-black transition-all italic ${selected === 'yes'
                        ? 'bg-black text-white'
                        : 'bg-white text-black/40 hover:bg-gray-50'
                        }`}
                >
                    {yesLabel}
                </button>
                <button
                    onClick={() => setSelected('no')}
                    className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all italic ${selected === 'no'
                        ? 'bg-black text-white'
                        : 'bg-white text-black/40 hover:bg-gray-50'
                        }`}
                >
                    {noLabel}
                </button>
            </div>

            <button
                disabled={!selected || isStaking || !connected}
                onClick={handleStake}
                className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all italic border-2 border-black ${!selected
                    ? 'bg-white text-black/20 border-black/10 cursor-not-allowed'
                    : isStaking
                        ? 'bg-gray-100 text-black cursor-wait'
                        : 'bg-orange-600 text-white hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
            >
                {isStaking ? 'SYNCHRONIZING...' : !connected ? 'NO_WALLET_SIGNAL' : `COMMIT_STAKE_FOR_${STAKE_AMOUNT}`}
            </button>
        </div>
    );
};
