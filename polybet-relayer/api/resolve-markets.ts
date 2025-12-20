import { Connection, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { fetchOpenMarkets, getProgram, resolveMarketOnChain } from "../utils/solana";
import { fetchPolymarketResult } from "../utils/polymarket";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req: any, res: any) {
    console.log("🚀 Relayer Execution Started...");

    // 1. Setup Connection & Wallet
    // Ensure SOLANA_RPC_URL and ORACLE_PRIVATE_KEY are set in Vercel Env
    const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(RPC_URL, "confirmed");

    if (!process.env.ORACLE_PRIVATE_KEY) {
        return res.status(500).json({ error: "Missing ORACLE_PRIVATE_KEY" });
    }

    const secretKey = Uint8Array.from(JSON.parse(process.env.ORACLE_PRIVATE_KEY));
    const oracleKeypair = Keypair.fromSecretKey(secretKey);
    const wallet = new anchor.Wallet(oracleKeypair);

    const program = getProgram(connection, wallet);

    try {
        // 2. Fetch all unresolved markets
        const openMarkets = await fetchOpenMarkets(program);
        console.log(`🔎 Found ${openMarkets.length} open markets.`);

        const resolutionResults = [];

        for (const marketObj of openMarkets) {
            const market = marketObj.account;
            const marketPDA = marketObj.publicKey;

            // Only check markets that have a linked polymarket_id
            if (market.polymarketId && market.polymarketId !== "") {
                console.log(`📋 Checking Market: ${market.question} (ID: ${market.polymarketId})`);

                const result = await fetchPolymarketResult(market.polymarketId);

                if (result.isResolved && result.winningOutcomeIndex !== undefined) {
                    console.log(`🎯 Market ${market.question} IS RESOLVED! Winner Index: ${result.winningOutcomeIndex}`);

                    try {
                        const tx = await resolveMarketOnChain(
                            program,
                            marketPDA,
                            result.winningOutcomeIndex,
                            oracleKeypair
                        );
                        console.log(`✅ Resolution TX Sent: ${tx}`);
                        resolutionResults.push({ question: market.question, status: "RESOLVED", tx });
                    } catch (e: any) {
                        console.error(`❌ Resolution failed for ${market.question}:`, e.message);
                        resolutionResults.push({ question: market.question, status: "FAILED", error: e.message });
                    }
                } else {
                    console.log(`⏳ Market ${market.question} is still live on Polymarket.`);
                    resolutionResults.push({ question: market.question, status: "LIVE" });
                }
            }
        }

        return res.status(200).json({
            message: "Relayer completed",
            processed: openMarkets.length,
            results: resolutionResults
        });

    } catch (error: any) {
        console.error("💥 Relayer Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
