# ERC20 Approval + Swap Integration

## What We Did

We integrated the ERC20 approval ability to allow token swaps to work properly. Before a swap can happen, the SwapAgent contract needs permission to spend your tokens.

## Changes Made

### 1. New Hook: `useERC20Approval.js`
**Location:** `/frontend/src/hooks/useERC20Approval.js`

A React hook that handles token approval requests:
- Approves a spender (SwapAgent) to spend a specific amount of tokens
- Uses Vincent's ERC20 approval ability
- Handles loading states and errors

### 2. New API Route: `approve-token`
**Location:** `/frontend/src/app/api/approve-token/route.js`

Server-side API that executes the approval ability:
- Validates JWT authentication
- Calls `@lit-protocol/vincent-ability-erc20-approval`
- Returns approval transaction results

### 3. Updated Component: `SwapExample.js`
**Location:** `/frontend/src/components/SwapExample.js`

Now performs a 2-step process:
1. **Approve**: Grant SwapAgent permission to spend tokens
2. **Swap**: Execute the token swap

### 4. Updated Dependencies
**Location:** `/frontend/package.json`

Added: `@lit-protocol/vincent-ability-erc20-approval`

## How It Works

```javascript
// Step 1: Approve SwapAgent to spend 10 STBL
await approveToken({
  tokenAddress: '0x575Ce3...', // StableCoin
  spenderAddress: '0x0765ba...', // SwapAgent
  amount: '10',
  rpcUrl: 'https://testnet.hashio.io/api',
  chainId: 296
});

// Step 2: Execute the swap
await executeSwap({
  tokenFrom: '0x575Ce3...', // StableCoin  
  tokenTo: '0x5bf5d13...', // MemeCoin
  amount: '10',
  swapAgentAddress: '0x0765ba...',
  rpcUrl: 'https://testnet.hashio.io/api',
  chainId: 296
});
```

## Next Steps

1. Run `npm install` in the frontend directory to install the new dependency
2. Restart your dev server
3. Test the "Approve & Swap Tokens" button
4. The swap should now work without authorization errors!

## Token Addresses (Hedera Testnet)

- **StableCoin**: `0x575Ce3448217fE6451654801e776115081F97020`
- **MemeCoin**: `0x5bf5d13184623EEB526490f4dc1238e8e71b96Cc`
- **NativeCoin**: `0x7FB87AAf2F2047a6F74018113326607d725CC715`
- **DeFiCoin**: `0xD3a23a772c7987a8BFb724e9330aB5C41B685356`
- **SwapAgent**: `0x7deF1dDf0074D9315BFC848c0c2d61F46ff80266`

## Your Current Balances

- MemeCoin: 10,000 MEME
- StableCoin: 1,000 STBL
- Native HBAR: ~99.96 HBAR
