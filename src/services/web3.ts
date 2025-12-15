import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3, Idl } from '@project-serum/anchor';
import idl from '@/idls/prophet.json';

const network = 'https://api.devnet.solana.com';
const opts = {
    preflightCommitment: "processed" as web3.Commitment,
};

// Program ID from the IDL or Devnet
// HOST: Using a temporary valid placeholder to allow build to pass. Update this after deployment!
export const PROGRAM_ID = new PublicKey("8f4FusHQaT2KxwpZzRNTV6TpdaEu68bcLFfJKBwZ3koE");

// Token used for betting (PROPHET)
export const BETTING_MINT = new PublicKey("HqQqPtf7FgFySXDHrTzExbGKUt4axd1JJQRDr9kZpump");
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

export const getMarketPDA = async (authority: PublicKey, question: string) => {
    return await PublicKey.findProgramAddress(
        [
            Buffer.from("market"),
            authority.toBuffer(),
            Buffer.from(question)
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
