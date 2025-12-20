# Polybet Relayer Environment Variables
# Copy these values to your Vercel Project Settings -> Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `SOLANA_RPC_URL` | Your Solana RPC Endpoint | `https://api.devnet.solana.com` |
| `ORACLE_PRIVATE_KEY` | The private key of your Oracle wallet in JSON array format | `[12, 45, 102, ...]` |

### How to get your Oracle Private Key from Solana Playground:
1. Open Solana Playground terminal.
2. Run `solana confirm -k` or check the hidden `.config/solana/id.json` file if accessible.
3. Be careful! Never share this key publicly.
