# 🎰 Polybet - Decentralized Prediction Markets

Polybet is a high-performance, on-chain prediction platform built on Solana. It allows users to bet on real-world outcomes using **$POLYBET** tokens with near-instant finality and zero central authority.

![Polybet Banner](https://i.imgur.com/your-polybet-banner.png)

## 🚀 Key Features

- **On-Chain Settlement**: Every vote is a transaction. Your tokens are held in secure, program-derived vaults on Solana.
- **Polymarket Mirroring**: Real-time discovery of global markets, instantly bridgeable to the Solana ecosystem.
- **Whale-Only Creation**: Market creation is gated to $POLYBET whales (5M+ tokens), ensuring high-quality, relevant prediction items.
- **Anti-Gravity UX**: A premium, "glassmorphism" interface designed for speed and clarity on both mobile and desktop.

## 🛠️ Tech Stack

- **Blockchain**: Solana (Anchor Framework 0.26.0)
- **Frontend**: Next.js 14, Framer Motion, Tailwind CSS
- **Wallet**: Solana Wallet Adapter (Phantom, Solflare)
- **Data**: Pyth Network & CoinGecko oracles

## 🏁 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_PROGRAM_ID=C7KxvEYEsqyE2TjG6gqNndS5Cj9v9tS1vS9FuvNpump
NEXT_PUBLIC_BETTING_MINT=22Tf2V9xR9V9v7V9v7V9v7V9v7V9v7V9v7V9v7V9v7V9
```

### 3. Run Development
```bash
npm run dev
```

## 📜 Smart Contract
The core logic is located in `/solana-contracts`. 
- **Program ID**: `C7Kxv...`
- **Audit Status**: Internal Alpha

---

## 🏗️ Community
Follow the journey:
- **X (Twitter)**: [@PolybetApp](https://x.com/PolybetApp)
- **Website**: [polybet.io](https://polybet.io)
