# Hedera EVM Setup Guide for Sentinel Protocol

This guide walks you through setting up the Sentinel Protocol to work with Hedera's EVM-compatible network.

## What is Hedera EVM?

Hedera is a public distributed ledger that supports EVM-compatible smart contracts through its JSON-RPC relay service. This allows you to use familiar Ethereum tools (MetaMask, Web3.js, Ethers.js) while benefiting from Hedera's:

- ⚡ High throughput (10,000+ TPS)
- 💰 Low, predictable fees
- 🔒 Enterprise-grade security
- 🌍 Carbon-negative network

## Quick Start

### 1. Get a Hedera Wallet

**For Testnet (Development):**
1. Visit [Hedera Portal](https://portal.hedera.com/)
2. Create a testnet account
3. Fund your account with test HBAR from the faucet
4. Export your private key (keep it secure!)

**For Mainnet (Production):**
1. Use a compatible wallet like MetaMask
2. Purchase HBAR from an exchange
3. Transfer HBAR to your wallet

### 2. Configure Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
# For Testnet
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_CHAIN_ID=296
NEXT_PUBLIC_HEDERA_RPC_URL=https://testnet.hashio.io/api

# Add your contract address after deployment
NEXT_PUBLIC_TOKEN_REPUTATION_CONTRACT_ADDRESS=0x...
```

### 3. Configure Backend (Reputation Layer)

```bash
cd reputation_layer
cp .env.example .env
```

Edit `.env`:
```env
# Network
RPC_URL=https://testnet.hashio.io/api
CHAIN_ID=296

# Contract
CONTRACT_ADDRESS=0x...
ABI_PATH=TokenReputationABI.json

# Your wallet (KEEP PRIVATE!)
PRIVATE_KEY=0x...
OWNER_ADDRESS=0x...

# API Keys
COINGECKO_API_KEY=your_key
COVALENT_API_KEY=your_key
```

### 4. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd reputation_layer
pip install -r requirements.txt
```

### 5. Validate Configuration

```bash
cd reputation_layer
python validate_config.py
```

This will check:
- ✓ All environment variables are set
- ✓ Network connection is working
- ✓ Contract is accessible
- ✓ Wallet is configured correctly

## Network Information

### Hedera Testnet
- **Chain ID**: 296 (0x128)
- **RPC URL**: https://testnet.hashio.io/api
- **Explorer**: https://hashscan.io/testnet
- **Faucet**: Available at Hedera Portal
- **Currency**: HBAR (test)

### Hedera Mainnet
- **Chain ID**: 295 (0x127)
- **RPC URL**: https://mainnet.hashio.io/api
- **Explorer**: https://hashscan.io/mainnet
- **Currency**: HBAR

## Adding Hedera to MetaMask

The frontend automatically prompts users to add the Hedera network, but you can also add it manually:

1. Open MetaMask
2. Click on the network dropdown
3. Click "Add Network"
4. Enter the following details:

**For Testnet:**
- Network Name: `Hedera Testnet`
- RPC URL: `https://testnet.hashio.io/api`
- Chain ID: `296`
- Currency Symbol: `HBAR`
- Block Explorer: `https://hashscan.io/testnet`

**For Mainnet:**
- Network Name: `Hedera Mainnet`
- RPC URL: `https://mainnet.hashio.io/api`
- Chain ID: `295`
- Currency Symbol: `HBAR`
- Block Explorer: `https://hashscan.io/mainnet`

## Deploying Smart Contracts

### Prerequisites
- Solidity compiler (solc)
- Hardhat or Foundry (optional, for easier deployment)
- HBAR in your wallet for gas fees

### Using Remix IDE

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Load your contract (`TokenReputationContract.sol`)
3. Compile the contract
4. Go to "Deploy & Run Transactions"
5. Select "Injected Provider - MetaMask"
6. Ensure MetaMask is on Hedera network
7. Deploy the contract
8. Copy the contract address
9. Update your `.env` files with the contract address

### Using Hardhat

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      chainId: 296,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

Deploy:
```bash
npx hardhat run scripts/deploy.js --network hederaTestnet
```

## Frontend Integration

The frontend includes a Hedera utility library at `src/lib/hedera.js`:

```javascript
import { 
  connectWallet, 
  switchToHederaNetwork,
  getCurrentNetwork,
  formatAddress 
} from '@/lib/hedera';

// Connect wallet
const { address, isCorrectNetwork } = await connectWallet();

// Switch network if needed
if (!isCorrectNetwork) {
  await switchToHederaNetwork();
}
```

## Backend Usage

### Calculate Reputation Scores

```bash
cd reputation_layer
python engine.py
```

This will:
1. Fetch token data from CoinGecko, Covalent
2. Calculate reputation scores
3. Save results to `reputation_scores.csv`

### Sync to Blockchain

```bash
python sync_reputation_to_chain.py
```

This will:
1. Read reputation scores from CSV
2. Connect to Hedera network
3. Submit transactions to update the smart contract
4. Display transaction results

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Hedera network

**Solutions**:
- Check RPC URL is correct
- Verify internet connection
- Try alternative RPC endpoints if available
- Check if Hedera network is operational at [status.hedera.com](https://status.hedera.com/)

### Transaction Failures

**Problem**: Transactions fail or revert

**Solutions**:
- Ensure wallet has sufficient HBAR for gas
- Check that contract address is correct
- Verify private key matches owner address
- Check gas limit is sufficient
- Review contract function parameters

### Wrong Network

**Problem**: MetaMask is on wrong network

**Solutions**:
- Use the frontend's automatic network switching
- Manually switch in MetaMask
- Check NEXT_PUBLIC_HEDERA_CHAIN_ID matches network

### API Rate Limiting

**Problem**: API requests being rate limited

**Solutions**:
- Increase API_DELAY in `.env`
- Upgrade to paid API tier
- Implement caching for repeated requests

## Cost Estimation

### Testnet
- **All operations are FREE** - use test HBAR from faucet

### Mainnet
- **Transactions**: ~$0.01-0.05 per transaction
- **Contract Deployment**: ~$1-5 depending on contract size
- **Contract Interactions**: ~$0.01-0.10 per function call

Note: Hedera fees are significantly lower than Ethereum mainnet!

## Security Best Practices

1. **Never commit `.env` files** - they contain sensitive data
2. **Use different wallets for testnet and mainnet**
3. **Keep minimal funds in hot wallets**
4. **Regularly rotate API keys**
5. **Use environment-specific configuration files**
6. **Validate all inputs before sending transactions**
7. **Test thoroughly on testnet before mainnet deployment**

## Resources

### Official Documentation
- [Hedera Documentation](https://docs.hedera.com/)
- [Smart Contracts on Hedera](https://docs.hedera.com/hedera/core-concepts/smart-contracts)
- [JSON-RPC Relay](https://docs.hedera.com/hedera/core-concepts/smart-contracts/json-rpc-relay)
- [Hedera Portal](https://portal.hedera.com/)

### Developer Tools
- [HashScan Explorer](https://hashscan.io/)
- [Hedera SDK for JavaScript](https://github.com/hashgraph/hedera-sdk-js)
- [Remix IDE](https://remix.ethereum.org/)

### Community
- [Hedera Discord](https://hedera.com/discord)
- [Hedera GitHub](https://github.com/hashgraph)
- [Developer Forum](https://hedera.com/discord)

## Support

If you encounter issues:
1. Check this guide and the READMEs
2. Run `validate_config.py` to diagnose configuration issues
3. Check the [Hedera documentation](https://docs.hedera.com/)
4. Ask in the [Hedera Discord](https://hedera.com/discord)
5. Open an issue on this repository

## Next Steps

1. ✓ Complete environment setup
2. ✓ Validate configuration
3. Deploy smart contracts to testnet
4. Test frontend wallet connection
5. Run reputation engine
6. Sync data to blockchain
7. Test end-to-end flow
8. Deploy to mainnet (when ready)

Happy building on Hedera! 🚀
