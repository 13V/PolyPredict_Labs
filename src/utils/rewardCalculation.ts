import { getAllVotes, Vote } from './voteStorage';
import { getPredictionOutcome } from './predictionManagement';

export interface Winner {
    walletAddress: string;
    predictionId: number;
    votedFor: 'yes' | 'no';
    rewardAmount: number;
}

export interface RewardCalculation {
    predictionId: number;
    totalRewardPool: number;
    winners: Winner[];
    totalWinners: number;
    rewardPerWinner: number;
}

/**
 * Calculate rewards for a closed prediction
 */
export function calculateRewards(
    predictionId: number,
    totalRewardPool: number = 1000 // Default: 1000 $POLYBET tokens
): RewardCalculation | null {
    // Get the outcome
    const outcome = getPredictionOutcome(predictionId);
    if (!outcome || !outcome.outcome) {
        return null;
    }

    // Get all votes for this prediction
    const allVotes = getAllVotes();
    const predictionVotes = allVotes.filter(v => v.predictionId === predictionId);

    // Filter winners (those who voted for the correct outcome)
    const winningVotes = predictionVotes.filter(v => v.choice === outcome.outcome);

    // Calculate reward per winner
    const totalWinners = winningVotes.length;
    const rewardPerWinner = totalWinners > 0 ? totalRewardPool / totalWinners : 0;

    // Create winner objects
    const winners: Winner[] = winningVotes.map(vote => ({
        walletAddress: vote.walletAddress,
        predictionId: vote.predictionId,
        votedFor: vote.choice,
        rewardAmount: rewardPerWinner,
    }));

    return {
        predictionId,
        totalRewardPool,
        winners,
        totalWinners,
        rewardPerWinner,
    };
}

/**
 * Calculate rewards for all closed predictions
 */
export function calculateAllRewards(
    rewardPoolPerPrediction: number = 1000
): RewardCalculation[] {
    const allVotes = getAllVotes();
    const predictionIds = [...new Set(allVotes.map(v => v.predictionId))];

    const calculations: RewardCalculation[] = [];

    for (const predictionId of predictionIds) {
        const calc = calculateRewards(predictionId, rewardPoolPerPrediction);
        if (calc) {
            calculations.push(calc);
        }
    }

    return calculations;
}

/**
 * Get total rewards owed to a specific wallet
 */
export function getTotalRewardsForWallet(walletAddress: string): number {
    const allCalculations = calculateAllRewards();
    let total = 0;

    for (const calc of allCalculations) {
        const winner = calc.winners.find(w => w.walletAddress === walletAddress);
        if (winner) {
            total += winner.rewardAmount;
        }
    }

    return total;
}

/**
 * Export reward data as CSV for bulk airdrop
 */
export function exportRewardsAsCSV(): string {
    const allCalculations = calculateAllRewards();

    // Aggregate rewards by wallet
    const rewardsByWallet = new Map<string, number>();

    for (const calc of allCalculations) {
        for (const winner of calc.winners) {
            const current = rewardsByWallet.get(winner.walletAddress) || 0;
            rewardsByWallet.set(winner.walletAddress, current + winner.rewardAmount);
        }
    }

    // Create CSV
    let csv = 'Wallet Address,Reward Amount\n';

    for (const [wallet, amount] of rewardsByWallet.entries()) {
        csv += `${wallet},${amount.toFixed(2)}\n`;
    }

    return csv;
}

/**
 * Download CSV file
 */
export function downloadRewardsCSV(): void {
    const csv = exportRewardsAsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polybet-rewards-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
