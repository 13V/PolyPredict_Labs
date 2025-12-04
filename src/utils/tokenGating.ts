import { Connection, PublicKey } from '@solana/web3.js';

// Real $OMEN token contract address from Pump.fun
const OMEN_TOKEN_ADDRESS = '7XuMtMfPXxHbjDLYtxmK4wRvYiFu1N9F8VDXukMTpump';
const MINIMUM_TOKENS = 1000; // Minimum tokens required to vote

/**
 * Check if a wallet holds the minimum required OMEN tokens
 * For MVP, this returns true (mock). After token launch, implement real check.
 */
export async function hasMinimumTokens(
  walletAddress: string,
  connection?: Connection
): Promise<boolean> {
  // Real token balance check implementation
  try {
    if (!connection) {
      connection = new Connection('https://api.mainnet-beta.solana.com');
    }

    const walletPublicKey = new PublicKey(walletAddress);
    const tokenPublicKey = new PublicKey(OMEN_TOKEN_ADDRESS);

    // Get token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { mint: tokenPublicKey }
    );

    if (tokenAccounts.value.length === 0) {
      return false;
    }

    // Get balance from first token account
    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;

    return balance >= MINIMUM_TOKENS;
  } catch (error) {
    console.error('Error checking token balance:', error);
    return false;
  }
}

/**
 * Get the token balance for a wallet
 */
export async function getTokenBalance(
  walletAddress: string,
  connection?: Connection
): Promise<number> {
  // Real balance check
  try {
    if (!connection) {
      connection = new Connection('https://api.mainnet-beta.solana.com');
    }

    const walletPublicKey = new PublicKey(walletAddress);
    const tokenPublicKey = new PublicKey(OMEN_TOKEN_ADDRESS);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { mint: tokenPublicKey }
    );

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}
