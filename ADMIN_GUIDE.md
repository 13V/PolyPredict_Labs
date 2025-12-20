# 🦅 Polybet - Protocol Admin Guide

This guide covers the administration of the Polybet on-chain prediction protocol.

## 🔑 Access Control

Unlike traditional apps, Polybet uses **Whale Auth** and **Program Authority**:

1. **Market Creation**: Only wallets holding more than **5,000,000 $POLYBET** can access the "Create Market" modal. This curation layer prevents spam on the Solana state.
2. **Resolution**: Only the original market creator (or the designated Oracle) can call the `resolveMarket` instruction.

---

## 🛠️ On-Chain Operations

### 1. Market Initialization
Users can "Lazy Initialize" markets from Polymarket. As an admin, you should:
- Monitor for blue **INITIALIZE** badges in the UI.
- Once initialized, the market becomes a permanent Solana account.
- **Tip**: You can pre-initialize key markets to ensure a smooth user experience.

### 2. Manual Resolution
If a market doesn't auto-resolve via the relayer:
- Navigate to `/admin`.
- Select the market and click **Resolve**.
- You must choose the winning index (0 = YES, 1 = NO for binary markets).
- **Warning**: Once resolved, tokens are unlocked for claiming and cannot be reversed.

### 3. Fee Distribution
The protocol collects a small fee on every bet. Admins can call:
- `distribute_fees`: Sends collected fees to the treasury wallet defined in the `Config` PDA.

---

## 📊 Monitoring & Curation

### Whale Management
- Ensure the **$POLYBET token mint** is correctly set in `web3.ts`.
- Check liquidity on Raydium/Jupiter to ensure users can acquire tokens for market creation.

### Market Integrity
- Review Polymarket mirrors daily.
- If a mirrored market is deleted or invalid on the source, resolve it as "Invalid" on Polybet to refund users.

---

## 📈 Troubleshooting

### "Transaction Timeout"
Solana congestion can occasionally delay market creation.
- Check **Solscan** for the wallet address.
- If the account exists, the UI will auto-sync on refresh.

### "Insufficient Permissions"
- Verify the connected wallet has 5M+ $POLYBET.
- Ensure you are the `authority` designated during market initialization.

---

## 🔒 Security Best Practices

1. **Keep Authority Wallets Safe**: Use a Ledger or Squads Multisig for the market authority.
2. **Oracle Consistency**: Always cross-reference multiple sources (Pyth, CoinGecko, Reuters) before resolving high-volume markets.
3. **Treasury Management**: Regularly sweep treasury fees to a secure cold wallet.
