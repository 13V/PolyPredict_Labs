import { Connection, PublicKey } from '@solana/web3.js';

// Real $PROPHET token contract address from Pump.fun (Aligned with page.tsx)
const PROPHET_TOKEN_ADDRESS = 'HqQqPtf7FgFySXDHrTzExbGKUt4axd1JJQRDr9kZpump';
const MINIMUM_TOKENS = 1000; // Minimum tokens required to vote

/**
 * Check if a wallet holds the minimum required PROPHET tokens
 * @param walletAddress The wallet to check
 * @param threshold The minimum amount required (default 1000)
 * @param connection Optional connection object
 */
export async function hasMinimumTokens(
  walletAddress: string,
  threshold: number = MINIMUM_TOKENS,
  connection?: Connection
): Promise<boolean> {
  // Real token balance check implementation
  try {
    if (!connection) {
      connection = new Connection('https://api.mainnet-beta.solana.com');
    }

    const walletPublicKey = new PublicKey(walletAddress);
    const tokenPublicKey = new PublicKey(PROPHET_TOKEN_ADDRESS);

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

    return balance >= threshold;
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
    const tokenPublicKey = new PublicKey(PROPHET_TOKEN_ADDRESS);

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
