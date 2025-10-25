# Swap on Hedera Testnet - Vincent Ability

A Vincent ability that enables token swaps on the Hedera testnet using a SwapAgent contract.

## Overview

This Vincent ability allows a PKP (Programmable Key Pair) to execute token swaps on the Hedera testnet through a deployed SwapAgent smart contract. The ability includes comprehensive prechecks and policy support to ensure safe and controlled swap operations.

## Features

- **Token Swapping**: Swap between any two ERC20 tokens via the SwapAgent contract
- **Precheck Validation**: Validates balance, allowance, and swap rates before execution
- **Policy Support**: Integrates with counter policy to limit swap frequency
- **Hedera Testnet**: Configured to work with Hedera testnet by default

## Ability Parameters

```typescript
{
  tokenFrom: string,        // Address of the token to swap from (0x...)
  tokenTo: string,          // Address of the token to swap to (0x...)
  amount: string,           // Amount to swap (in ether units, e.g., "100")
  swapAgentAddress: string, // Address of the deployed SwapAgent contract
  rpcUrl?: string          // Optional RPC URL (defaults to Hedera testnet)
}
```

## Usage Example

```typescript
const swapParams = {
  tokenFrom: '0x5bf5d13184623EEB526490f4dc1238e8e71b96Cc', // MemeCoin
  tokenTo: '0x575Ce3448217fE6451654801e776115081F97020', // StableCoin
  amount: '100', // 100 tokens
  swapAgentAddress: '0x0765ba4d82553cD6ce053E6273567cB6A32B4fa0',
  rpcUrl: 'https://testnet.hashio.io/api', // Optional
};
```

## Precheck Phase

The ability performs the following checks before execution:

1. **Balance Check**: Verifies the PKP has sufficient token balance
2. **Allowance Check**: Ensures SwapAgent has approval to spend tokens
3. **Swap Rate Check**: Validates a swap rate exists for the token pair
4. **Output Calculation**: Calculates expected output amount

### Precheck Success Response

```typescript
{
  availableBalance: string,  // Current token balance
  swapRate: string,          // Exchange rate (in wei)
  expectedOutput: string     // Expected amount of tokenTo
}
```

### Precheck Failure Reasons

- `INSUFFICIENT_BALANCE`: Not enough tokens to perform swap
- `INSUFFICIENT_ALLOWANCE`: SwapAgent not approved to spend tokens
- `INVALID_SWAP_RATE`: No swap rate set for this token pair

## Execute Phase

The execute phase:

1. Constructs the swap transaction
2. Signs it with the PKP
3. Submits to Hedera testnet
4. Commits to policy counter (if enabled)
5. Returns transaction details

### Execute Success Response

```typescript
{
  txHash: string,      // Transaction hash
  tokenFrom: string,   // Source token address
  tokenTo: string,     // Destination token address
  amountIn: string,    // Amount swapped in
  amountOut: string,   // Amount received out
  timestamp: number    // Execution timestamp
}
```

## SwapAgent Contract

The ability interacts with a SwapAgent contract that must be pre-deployed with the following interface:

```solidity
function swapTokens(
  address tokenFrom,
  address tokenTo,
  address user,
  uint256 amount
) external;

function rates(
  address tokenFrom,
  address tokenTo
) external view returns (uint256);
```

### Setting Up SwapAgent

1. Deploy the SwapAgent contract
2. Set swap rates using `setRate(tokenFrom, tokenTo, rate)`
3. Fund the contract with liquidity for the tokens you want to swap to
4. Users must approve SwapAgent to spend their tokens before swapping

## Prerequisites

Before using this ability, ensure:

1. **SwapAgent is deployed** on Hedera testnet
2. **Swap rates are configured** for your token pairs
3. **SwapAgent has liquidity** for the tokens you're swapping to
4. **PKP has approved** SwapAgent to spend tokens (or ability will fail precheck)

## Policy Integration

The ability supports the counter policy to limit swap frequency:

```typescript
const swapLimitPolicyContext =
  policiesContext.allowedPolicies['@lit-protocol/vincent-example-policy-counter'];
```

If enabled, each successful swap increments the counter, allowing you to enforce limits like "max 10 swaps per day".

## Default Configuration

- **RPC URL**: `https://testnet.hashio.io/api` (Hedera testnet)
- **Gas Limit**: 150,000 (configurable in code)
- **Package Name**: `@lit-protocol/vincent-example-ability-swap-hedera`

## Error Handling

All errors are logged with detailed context and returned in a structured format:

```typescript
{
  error: string,    // Human-readable error message
  reason?: string   // Machine-readable error code
}
```

## Development

```bash
# Build the ability
npm run build

# The ability will be compiled and ready for deployment
```

## Smart Contract Addresses (Hedera Testnet)

Example deployed contracts:

- **MemeCoin**: `0x5bf5d13184623EEB526490f4dc1238e8e71b96Cc`
- **StableCoin**: `0x575Ce3448217fE6451654801e776115081F97020`
- **NativeCoin**: `0x7FB87AAf2F2047a6F74018113326607d725CC715`
- **DeFiCoin**: `0xD3a23a772c7987a8BFb724e9330aB5C41B685356`
- **SwapAgent**: `0x0765ba4d82553cD6ce053E6273567cB6A32B4fa0`

## License

MIT
