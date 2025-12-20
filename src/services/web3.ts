import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3, Idl } from '@project-serum/anchor';
import idl from '@/idl/polybet.json';

const network = 'https://api.devnet.solana.com';
const opts = {
    preflightCommitment: "processed" as web3.Commitment,
};

// Program ID from the IDL or Devnet
// Program ID from the IDL or Devnet
export const PROGRAM_ID = new PublicKey('DcNb3pYGVqo1AdMdJGycDpRPb6d1nPsg3z4x5T714YW');

// Token used for betting (POLYBET)
export const BETTING_MINT = new PublicKey('6ZFUNyPDn1ycjhb3RbNAmtcVvwp6oL4Zn6GswnGupump');
// export const USDC_MINT = ... (Deprecated)
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

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

import { BN } from '@project-serum/anchor';

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
