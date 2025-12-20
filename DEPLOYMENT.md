# 🛳️ Polybet - Deployment Guide

This guide ensures a seamless transition of the Polybet protocol from development to production.

## ✅ Production Readiness Checklist

### 1. Smart Contract (Anchor)
- [ ] Program ID updated in `Anchor.toml` and `lib.rs`
- [ ] Deployed to Solana Mainnet-Beta
- [ ] Verified on Solana Explorer/Solscan
- [ ] IDL exported and synced to `src/idl/polybet.json`

### 2. Frontend (Next.js)
- [ ] `PROGRAM_ID` in `src/services/web3.ts` matches deployment
- [ ] `BETTING_MINT` set to official $POLYBET token address
- [ ] `CREATION_THRESHOLD` (5M) verified for market curation
- [ ] RPC endpoint set to high-performance provider (Helius/Triton)

---

## 🚀 Deployment Steps

### Step 1: Deploy Smart Contract
```bash
cd solana-contracts
anchor build
anchor deploy --provider.cluster mainnet
```

### Step 2: Extract & Sync IDL
Copy the generated IDL to the frontend to ensure type-safe interactions:
```bash
cp target/idl/polybet.json ../src/idl/polybet.json
```

### Step 3: Frontend Environment Variables
Set these on Vercel:
- `NEXT_PUBLIC_SOLANA_NETWORK`: `mainnet-beta`
- `NEXT_PUBLIC_RPC_URL`: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
- `NEXT_PUBLIC_PROGRAM_ID`: `your_program_id`

### Step 4: Vercel Deployment
```bash
npx vercel --prod
```

---

## 🛠️ Key Technical Files

- **`src/services/web3.ts`**: Core connectivity hub. Update `PROGRAM_ID` here for one-click migration.
- **`src/app/page.tsx`**: Logic for fetching On-Chain markets from the Solana state.
- **`src/components/PredictionCard.tsx`**: Handles "Lazy Initialization" of Polymarket events.

## ⚠️ Important Notes
- **Vault Security**: The protocol uses Program Derived Addresses (PDAs) to store tokens. Only the program itself (or designated authorities in the IDL) can authorize distributions.
- **Oracle Reliability**: Ensure Pyth feeds are active for the markets you intend to feature.

---

## 🆘 Support & Maintenance
- **Monitor**: Use `solana logs -u mainnet-beta` to track live transactions.
- **Admin**: Use the Polybet Admin Panel (`/admin`) to settle markets manually if automated resolution fails.
