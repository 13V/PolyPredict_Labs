import { getProgram, getVotePDA } from '@/services/web3';
import { PublicKey } from '@solana/web3.js';

export interface Vote {
    predictionId: number;
    choice: 'yes' | 'no';
    walletAddress: string;
    timestamp: number;
    amount?: number; // Optional stake amount
    txHash?: string; // Blockchain Transaction Hash
}

const VOTES_KEY = 'prophet_votes';

/**
 * Save a vote to localStorage AND Blockchain
 */
export async function saveVote(vote: Vote, wallet?: any): Promise<string | void> {

    // 1. Blockchain Transaction (Real)
    if (wallet && wallet.publicKey) {
        try {
            console.log("Initiating On-Chain Vote...");
            const program = getProgram(wallet);

            if (program) {
                // Determine outcome index
                const outcomeIndex = vote.choice === 'yes' ? 0 : 1;
                const amount = vote.amount || 0;

                // Derive PDA
                // NOTE: In a real app we'd fetch the actual market PDA from the ID
                // For MVP we mock the market Key (using System Program ID as valid placeholder)
                const marketKey = new PublicKey("11111111111111111111111111111111");
                const votePda = await getVotePDA(marketKey, wallet.publicKey);

                // Call the Smart Contract
                // @ts-ignore - Dynamic Method from IDL
                const tx = await program.methods.placeVote(outcomeIndex, new anchor.BN(amount))
                    .accounts({
                        market: marketKey,
                        vote: votePda,
                        user: wallet.publicKey,
                    })
                    .rpc();

                console.log("Vote Transaction Sent!", tx);
                vote.txHash = tx;
            }
        } catch (e) {
            console.warn("Blockchain Transaction Failed (Simulation Mode Continuing):", e);
            // We continue to save locally so the UI updates
        }
    }

    // 2. Local Storage (Fallback/Cache)
    const votes = getAllVotes();

    // Remove any existing vote for this prediction by this wallet
    const filteredVotes = votes.filter(
        v => !(v.predictionId === vote.predictionId && v.walletAddress === vote.walletAddress)
    );

    // Add new vote
    filteredVotes.push(vote);

    localStorage.setItem(VOTES_KEY, JSON.stringify(filteredVotes));
}

/**
 * Get all votes from localStorage
 */
export function getAllVotes(): Vote[] {
    if (typeof window === 'undefined') return [];

    const votesJson = localStorage.getItem(VOTES_KEY);
    if (!votesJson) return [];

    try {
        return JSON.parse(votesJson);
    } catch {
        return [];
    }
}

/**
 * Get a specific vote for a prediction by wallet
 */
export function getVote(predictionId: number, walletAddress: string): Vote | null {
    const votes = getAllVotes();
    return votes.find(
        v => v.predictionId === predictionId && v.walletAddress === walletAddress
    ) || null;
}

/**
 * Get vote counts for a prediction
 */
export function getVoteCounts(predictionId: number): { yes: number; no: number } {
    const votes = getAllVotes();
    const predictionVotes = votes.filter(v => v.predictionId === predictionId);

    return {
        yes: predictionVotes.filter(v => v.choice === 'yes').length,
        no: predictionVotes.filter(v => v.choice === 'no').length,
    };
}

/**
 * Clear all votes (for testing)
 */
export function clearAllVotes(): void {
    localStorage.removeItem(VOTES_KEY);
    localStorage.removeItem('prophet_resolutions');
}

// --- Resolution Storage ---

const RESOLUTIONS_KEY = 'prophet_resolutions';

export interface Resolution {
    predictionId: number;
    outcome: 'yes' | 'no';
    timestamp: number;
    stakedAmount: number;
}

export function saveResolution(predictionId: number | Resolution, outcome?: 'yes' | 'no'): void {
    const resolutions = getAllResolutions();

    let newResolution: Resolution;

    if (typeof predictionId === 'object') {
        newResolution = predictionId;
    } else {
        if (!outcome) return; // Should not happen based on usage
        newResolution = {
            predictionId,
            outcome,
            timestamp: Date.now(),
            stakedAmount: 0 // Default for Oracle/Auto resolution
        };
    }

    // Remove existing if any (update it)
    const filtered = resolutions.filter(r => r.predictionId !== newResolution.predictionId);
    filtered.push(newResolution);

    localStorage.setItem(RESOLUTIONS_KEY, JSON.stringify(filtered));
}

export function getAllResolutions(): Resolution[] {
    if (typeof window === 'undefined') return [];
    const json = localStorage.getItem(RESOLUTIONS_KEY);
    return json ? JSON.parse(json) : [];
}

export function getResolutionStatus(predictionId: number): 'yes' | 'no' | null {
    const resolutions = getAllResolutions();
    // For MVP: If ANYONE verified it, it's resolved.
    // In production: We would count votes.
    const match = resolutions.find(r => r.predictionId === predictionId);
    return match ? match.outcome : null;
}
