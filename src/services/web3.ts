import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3, Idl, BN } from '@coral-xyz/anchor';
import idl from '@/idl/polybet.json';

const network = process.env.NEXT_PUBLIC_RPC_URL || 'https://solana-rpc.publicnode.com';
const opts = {
    preflightCommitment: "processed" as web3.Commitment,
};

// Program ID (Prophet/Polybet Contract)
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || 'F4ftWfZqAq99NK6yWTdA3B65xMwHVeD3MqVcqsvwbKzD'
);

// Token used for betting ($PREDICT) - Pump.fun deployment
// If not set, we'll use a placeholder and handle it in the UI
const MINT_ENV = process.env.NEXT_PUBLIC_BETTING_MINT || '4kTwv7sEEhdp9CZnw3B9h639HZwVygMmmxi6uuFLpump';
export const IS_TOKEN_LIVE = true;

export const BETTING_MINT = new PublicKey(
    '4kTwv7sEEhdp9CZnw3B9h639HZwVygMmmxi6uuFLpump'
);

// Treasury Wallet for collecting protocol taxes
export const TREASURY_WALLET = new PublicKey(
    process.env.NEXT_PUBLIC_TREASURY_WALLET || '2KF9SAvpU2h2ZhczzMLbgx7arkjG8QHCXbQ6XaDqtEtm'
);

// Constants
export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export const getATA = async (owner: PublicKey, mint: PublicKey) => {
    const [ata] = await PublicKey.findProgramAddress(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    );
    return ata;
};


export const getProvider = (wallet: any) => {
    if (!wallet) return null;
    const connection = new Connection(network, opts.preflightCommitment);

    return new AnchorProvider(
        connection,
        wallet,
        opts
    );
};

export const getProgram = (wallet: any) => {
    const provider = getProvider(wallet);
    if (!provider) return null;

    // Cast JSON to IDL type unsafely for now to avoid TS hell with custom IDLs
    return new Program(idl as unknown as Idl, PROGRAM_ID, provider);
};



export const getMarketPDA = async (marketId: number) => {
    return await PublicKey.findProgramAddress(
        [
            Buffer.from("market"),
            new BN(marketId).toArrayLike(Buffer, 'le', 8)
        ],
        PROGRAM_ID
    );
};

export const getVotePDA = async (market: PublicKey, user: PublicKey) => {
    return await PublicKey.findProgramAddress(
        [
            Buffer.from("vote"),
            market.toBuffer(),
            user.toBuffer()
        ],
        PROGRAM_ID
    );
};

export const getConfigPDA = async () => {
    const [config] = await PublicKey.findProgramAddress(
        [Buffer.from("config")],
        PROGRAM_ID
    );
    return config;
};

export const getTreasuryVaultPDA = async () => {
    const [vault] = await PublicKey.findProgramAddress(
        [Buffer.from("treasury")],
        PROGRAM_ID
    );
    return vault;
};

// --- Transaction Helpers ---

export const initializeProtocol = async (wallet: any, mint: PublicKey) => {
    const program = getProgram(wallet);
    if (!program) throw new Error("Wallet not connected");

    const config = await getConfigPDA();
    const treasuryVault = await getTreasuryVaultPDA();

    return await program.methods
        .initializeProtocol()
        .accounts({
            config,
            treasuryVault,
            mint,
            authority: wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
};

export const initializeMarketOnChain = async (
    wallet: any,
    question: String,
    endTimestamp: number,
    outcomesCount: number,
    virtualLiquidity: number,
    weights: number[]
) => {
    const program = getProgram(wallet);
    if (!program) throw new Error("Wallet not connected");

    // Padding weights to 8 elements as required by the contract
    const paddedWeights = [...weights];
    while (paddedWeights.length < 8) paddedWeights.push(0);

    const [market] = await PublicKey.findProgramAddress(
        [Buffer.from("market"), wallet.publicKey.toBuffer(), Buffer.from(question)],
        PROGRAM_ID
    );

    return await program.methods
        .initializeMarket(
            question,
            new BN(endTimestamp),
            outcomesCount,
            new BN(virtualLiquidity),
            paddedWeights
        )
        .accounts({
            market,
            authority: wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
};

export const sweepProfit = async (wallet: any, amount: number, destinationToken: PublicKey) => {
    const program = getProgram(wallet);
    if (!program) throw new Error("Wallet not connected");

    const config = await getConfigPDA();
    const treasuryVault = await getTreasuryVaultPDA();

    return await program.methods
        .sweepProfit(new BN(amount))
        .accounts({
            config,
            treasuryVault,
            destinationToken,
            authority: wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
};
