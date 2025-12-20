import { getProgram, getVotePDA, getATA, BETTING_MINT } from '@/services/web3';
import { PublicKey } from '@solana/web3.js';
import { BN, web3 } from '@project-serum/anchor';

export interface Vote {
    predictionId: number;
    choice: 'yes' | 'no' | 'multi'; // Allow multi-outcome
    outcomeIndex?: number; // Specific outcome index
    walletAddress: string;
    marketPublicKey?: string; // LINK TO BLOCKCHAIN PDA
    timestamp: number;
    amount?: number;
    txHash?: string;
}

const VOTES_KEY = 'polybet_votes';

/**
 * Save a vote to Blockchain and cache to localStorage only on success
 */
export async function saveVote(vote: Vote, wallet: any): Promise<string | void> {
    if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet connection required to vote.");
    }
    try {
        console.log("Initiating On-Chain Vote...");
        const program = getProgram(wallet);

        if (program) {
            // Determine outcome index
            const outcomeIndex = vote.outcomeIndex ?? (vote.choice === 'yes' ? 0 : 1);
            const amount = vote.amount || 0;

            // Derive PDA
            // Use the provided marketPublicKey or fallback to a derivation (if we have authority/question)
            // For MVP, we pass the marketPublicKey string from the mapped on-chain markets
            const marketKey = vote.marketPublicKey ? new PublicKey(vote.marketPublicKey) : new PublicKey("11111111111111111111111111111111");

            if (marketKey.toString() === "11111111111111111111111111111111") {
                console.warn("No real marketPublicKey provided - check prediction data mapping.");
                throw new Error("Invalid Market Account");
            }

            const votePda = await getVotePDA(marketKey, wallet.publicKey);

            // Derive Token Accounts
            const userToken = await getATA(wallet.publicKey, BETTING_MINT);
            const vaultToken = await getATA(marketKey, BETTING_MINT);

            // Call the Smart Contract
            const tx = await program.methods.placeVote(outcomeIndex, new BN(amount))
                .accounts({
                    market: marketKey,
                    vote: (votePda as any)[0], // getVotePDA returns [pda, bump]
                    vaultToken: vaultToken,
                    userToken: userToken,
                    user: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                })
                .rpc();

            console.log("Vote Transaction Sent!", tx);
            vote.txHash = tx;

            // 2. Local Storage Cache (On Success Only)
            const votes = getAllVotes();

            // Remove any existing vote for this prediction by this wallet
            const filteredVotes = votes.filter(
                v => !(v.predictionId === vote.predictionId && v.walletAddress === vote.walletAddress)
            );

            // Add new vote
            filteredVotes.push(vote);

            localStorage.setItem(VOTES_KEY, JSON.stringify(filteredVotes));
            return tx;
        } else {
            throw new Error("Smart contract program not initialized");
        }
    } catch (e: any) {
        console.error("Blockchain Transaction Failed:", e);
        throw e; // Propagate error to UI
    }
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
 * Clear all votes
 */
export function clearAllVotes(): void {
    localStorage.removeItem(VOTES_KEY);
    localStorage.removeItem('polybet_resolutions');
}

// --- Resolution Storage ---

const RESOLUTIONS_KEY = 'polybet_resolutions';

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
