import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
    PublicKey,
    Keypair,
    Connection,
    SystemProgram,
    SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
// import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"; // Removed to avoid dependency issues
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBnBLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
import * as fs from "fs";
import * as path from "path";

// Configuration
const RPC_URL = "https://responsive-serene-mountain.solana-mainnet.quiknode.pro/3bbbfd1c58e3e0392db876741a554ba776af21d7/";
const PROGRAM_ID = new PublicKey("8m7wUvDdNc7U8nyutZKPLM4zn5CXuJWXovpKE6PvuiEj");
const MINT_ADDRESS = new PublicKey("4kTwv7sEEhdp9CZnw3B9h639HZwVygMmmxi6uuFLpump");
const WALLET_PATH = path.join(process.env.HOME || "", ".config/solana/id.json");

// Load IDL (Use process.cwd since we are running from project root)
const idlPath = path.join(process.cwd(), "src/idl/polybet.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

async function main() {
    console.log("🚀 Starting PolyPredict Mainnet Initialization...");

    // Setup Connection & Wallet
    const connection = new Connection(RPC_URL, "confirmed");
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_PATH, "utf8")));
    const wallet = Keypair.fromSecretKey(secretKey);
    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), { commitment: "confirmed" });
    anchor.setProvider(provider);

    const program = new Program(idl, provider);

    console.log("Wallet Address:", wallet.publicKey.toBase58());
    console.log("Program ID:", PROGRAM_ID.toBase58());
    console.log("Mint Address:", MINT_ADDRESS.toBase58());

    // Derive PDAs
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        PROGRAM_ID
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        PROGRAM_ID
    );

    console.log("Config PDA:", configPda.toBase58());
    console.log("Vault PDA:", vaultPda.toBase58());

    try {
        console.log("\n--- Checking Account Status ---");
        const configAccount = await connection.getAccountInfo(configPda);
        if (configAccount) {
            console.log("✅ Protocol is already initialized (Config exists).");
            return;
        }
        console.log("⏳ Protocol not initialized. Sending transaction...");

        // Build Instruction
        // Using 'any' cast to bypass "Type instantiation is excessively deep" errors
        const tx = await (program.methods as any)
            .initializeProtocol()
            .accounts({
                config: configPda,
                treasuryVault: vaultPda,
                mint: MINT_ADDRESS,
                authority: wallet.publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
            } as any)
            .rpc();

        console.log("\n🎉 SUCCESS!");
        console.log("Transaction Signature:", tx);
    } catch (err: any) {
        console.error("\n❌ ERROR:");
        if (err.logs) {
            console.log("Logs:", err.logs.join("\n"));
        } else {
            console.error(err);
        }
    }
}

main();
