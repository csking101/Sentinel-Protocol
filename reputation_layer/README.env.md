# Environment Variables Setup

This document explains how to set up environment variables for the Sentinel Protocol reputation engine.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your specific configuration values.

## Required Configuration

### Hedera Network Configuration

Configure the connection to Hedera's EVM-compatible network:

#### Testnet (Recommended for Development)
```env
RPC_URL=https://testnet.hashio.io/api
CHAIN_ID=296
```

#### Mainnet (Production Only)
```env
RPC_URL=https://mainnet.hashio.io/api
CHAIN_ID=295
```

### Smart Contract Configuration

```env
CONTRACT_ADDRESS=0x...  # Your deployed TokenReputation contract address
ABI_PATH=TokenReputationABI.json  # Path to the contract ABI file
```

### Wallet Configuration

⚠️ **CRITICAL**: Never commit these values or share them publicly!

```env
PRIVATE_KEY=0x...  # Your wallet's private key (with 0x prefix)
OWNER_ADDRESS=0x...  # Your wallet's public address
```

**Getting a Hedera Wallet:**
1. Visit [Hedera Portal](https://portal.hedera.com/)
2. Create a testnet account
3. Get test HBAR from the faucet
4. Export your private key (keep it secure!)

### API Keys for Data Sources

The reputation engine fetches data from multiple sources:

#### CoinGecko API
```env
COINGECKO_API_KEY=your_api_key_here
```
Get a free API key at: https://www.coingecko.com/en/api

#### Covalent API
```env
COVALENT_API_KEY=your_api_key_here
```
Get a free API key at: https://www.covalenthq.com/

#### Etherscan API (Optional)
```env
ETHERSCAN_API_KEY=your_api_key_here
```
Currently not required for Hedera network operations.

### Rate Limiting Configuration

Control API request behavior:

```env
API_DELAY=1.0        # Delay between API requests in seconds
MAX_RETRIES=3        # Maximum number of retry attempts
RETRY_DELAY=2.0      # Delay between retries in seconds
```

## Validating Your Configuration

Before running the main scripts, validate your configuration:

```bash
python validate_config.py
```

This script will:
- ✓ Check that all required environment variables are set
- ✓ Test connection to the Hedera network
- ✓ Verify your contract configuration
- ✓ Validate your wallet setup (if configured)

## Running the Scripts

### Calculate Reputation Scores
```bash
python engine.py
```

### Sync Scores to Blockchain
```bash
python sync_reputation_to_chain.py
```

## Security Best Practices

1. **Never commit `.env` files** - they are already in `.gitignore`
2. **Use environment-specific .env files**:
   - `.env.development` for local development
   - `.env.production` for production
3. **Use separate wallets**:
   - Testnet wallet for development
   - Mainnet wallet with minimal funds for production
4. **Rotate API keys regularly**
5. **Use read-only keys where possible**

## Troubleshooting

### Connection Issues
- Verify RPC_URL is correct and accessible
- Check that CHAIN_ID matches the network (296 for testnet, 295 for mainnet)
- Ensure your wallet has sufficient HBAR for gas fees

### Transaction Failures
- Check that PRIVATE_KEY and OWNER_ADDRESS match
- Verify contract address is correct
- Ensure wallet has sufficient HBAR balance
- Check that the ABI file exists and is valid JSON

### API Rate Limiting
- Increase API_DELAY if you're hitting rate limits
- Consider upgrading to paid API tiers for higher limits

## Resources

- [Hedera EVM Documentation](https://docs.hedera.com/hedera/core-concepts/smart-contracts)
- [HashIO JSON-RPC Relay](https://docs.hedera.com/hedera/core-concepts/smart-contracts/json-rpc-relay)
- [Python-dotenv Documentation](https://pypi.org/project/python-dotenv/)
- [Web3.py Documentation](https://web3py.readthedocs.io/)
