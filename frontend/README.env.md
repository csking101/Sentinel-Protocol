# Environment Variables Setup

This document explains how to set up environment variables for the Sentinel Protocol frontend.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your specific configuration values.

## Configuration Variables

### Hedera Network Configuration

The frontend connects to the Hedera EVM-compatible network. You can use either testnet or mainnet:

#### Testnet (Recommended for Development)
```env
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_CHAIN_ID=296
NEXT_PUBLIC_HEDERA_RPC_URL=https://testnet.hashio.io/api
```

#### Mainnet (Production Only)
```env
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
NEXT_PUBLIC_HEDERA_CHAIN_ID=295
NEXT_PUBLIC_HEDERA_RPC_URL=https://mainnet.hashio.io/api
```

### Smart Contract Configuration

After deploying your smart contracts, add the contract addresses:

```env
NEXT_PUBLIC_TOKEN_REPUTATION_CONTRACT_ADDRESS=0x...
```

### Optional Configuration

#### WalletConnect
If you want to support WalletConnect in addition to MetaMask:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get a free Project ID at: https://cloud.walletconnect.com

#### API Backend
If running a separate backend API:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Important Notes

- **Never commit `.env.local` or `.env` files to version control** - they contain sensitive information
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Do not store private keys or secrets in variables starting with `NEXT_PUBLIC_`
- The `.env.local` file takes precedence over `.env` in Next.js

## Getting Hedera Testnet Tokens

1. Visit the [Hedera Portal](https://portal.hedera.com/)
2. Create a testnet account
3. Fund your account with test HBAR using the testnet faucet

## Resources

- [Hedera EVM Documentation](https://docs.hedera.com/hedera/core-concepts/smart-contracts)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [HashIO JSON-RPC Relay](https://docs.hedera.com/hedera/core-concepts/smart-contracts/json-rpc-relay)
