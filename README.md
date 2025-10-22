# Sentinel-Protocol
This project is being built for ETHOnline 2025

## Overview

Sentinel Protocol is an intelligent asset protection system that leverages AI-powered risk management to protect cryptocurrency portfolios on the Hedera EVM network.

## Quick Start

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.8+ (for reputation engine)
- A Hedera wallet (testnet or mainnet)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/csking101/Sentinel-Protocol.git
   cd Sentinel-Protocol
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your Hedera configuration
   npm run dev
   ```
   
   See [frontend/README.env.md](frontend/README.env.md) for detailed environment variable documentation.

3. **Reputation Engine Setup**
   ```bash
   cd reputation_layer
   pip install -r requirements.txt  # Create this if needed
   cp .env.example .env
   # Edit .env with your API keys and Hedera wallet credentials
   python engine.py
   ```
   
   See [reputation_layer/README.env.md](reputation_layer/README.env.md) for detailed environment variable documentation.

## Environment Configuration

This project uses the Hedera EVM-compatible network. You'll need to configure:

- **Hedera Network**: Testnet (Chain ID: 296) or Mainnet (Chain ID: 295)
- **RPC Endpoint**: HashIO JSON-RPC Relay (https://testnet.hashio.io/api)
- **Smart Contract Addresses**: Deploy and configure your TokenReputation contract
- **API Keys**: CoinGecko, Covalent for reputation data
- **Wallet**: Hedera-compatible wallet with HBAR for gas fees

Detailed setup instructions are available in:
- [frontend/README.env.md](frontend/README.env.md)
- [reputation_layer/README.env.md](reputation_layer/README.env.md)

## Architecture

- **Frontend**: Next.js application with MetaMask integration for Hedera EVM
- **Reputation Layer**: Python engine for calculating token reputation scores
- **Smart Contracts**: Solidity contracts deployed on Hedera EVM

## Resources

- [Hedera Documentation](https://docs.hedera.com/)
- [Hedera EVM Guide](https://docs.hedera.com/hedera/core-concepts/smart-contracts)
- [HashIO JSON-RPC Relay](https://docs.hedera.com/hedera/core-concepts/smart-contracts/json-rpc-relay)
