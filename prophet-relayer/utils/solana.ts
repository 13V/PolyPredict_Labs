import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import idl from "../idl.json";

export const PROGRAM_ID = new PublicKey("DcNb3pYGVqo1AdMdJGycDpRPb6d1nPsg3z4x5T714YW");

export function getProgram(connection: Connection, wallet: any) {
    const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });
    return new Program(idl as any, PROGRAM_ID, provider);
}

export async function fetchOpenMarkets(program: Program) {
    const markets = await program.account.market.all();
    return markets.filter((m: any) => !m.account.resolved && !m.account.paused);
}

export async function resolveMarketOnChain(
    program: Program,
    marketPDA: PublicKey,
    outcomeIndex: number,
    authority: Keypair
) {
    return await program.methods
        .resolveViaOracle(outcomeIndex)
        .accounts({
            market: marketPDA,
            authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();
}
