# Vincent Swap Ability Integration

## Server-Side Setup Complete ✅

Your server-side ability execution is now ready!

## What You Need to Do

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Delegatee Signer

1. Go to your Vincent Dashboard: https://vincent.lit.dev
2. Navigate to your app's Delegatees section
3. Create a new delegatee signer (or use an existing one)
4. Copy the private key
5. Add it to `.env.local`:
   ```
   DELEGATEE_PRIVATE_KEY=0x...your-private-key...
   ```

⚠️ **IMPORTANT**: Never commit this private key to git! The `.env.local` file should be in `.gitignore`.

### 3. How It Works

#### Backend Flow (`/api/execute-swap/route.js`):
1. Receives JWT from frontend
2. Verifies JWT is valid
3. Extracts PKP address from JWT
4. Runs precheck (validates balance, allowance, swap rate)
5. Executes the swap ability using your delegatee signer
6. Returns transaction hash and swap details

#### Frontend Usage:

```javascript
import { useSwapAbility } from '@/hooks/useSwapAbility';

function MyComponent() {
  const { executeSwap, isExecuting } = useSwapAbility();

  const handleSwap = async () => {
    const result = await executeSwap({
      tokenFrom: '0x...', 
      tokenTo: '0x...',
      amount: '10',
      swapAgentAddress: '0x...',
    });
    
    console.log('Swap complete:', result.txHash);
  };

  return (
    <button onClick={handleSwap} disabled={isExecuting}>
      Swap Tokens
    </button>
  );
}
```

## API Endpoint

**POST** `/api/execute-swap`

**Headers:**
```
Authorization: Bearer <vincent-jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "tokenFrom": "0x...",
  "tokenTo": "0x...",
  "amount": "10",
  "swapAgentAddress": "0x...",
  "rpcUrl": "https://testnet.hashio.io/api"
}
```

**Success Response:**
```json
{
  "success": true,
  "result": {
    "txHash": "0x...",
    "tokenFrom": "0x...",
    "tokenTo": "0x...",
    "amountIn": "10",
    "amountOut": "10.5",
    "timestamp": 1234567890
  }
}
```

## Security Notes

✅ JWT is verified on the server
✅ Delegatee private key never leaves the server
✅ User's PKP executes the transaction via Lit Network
✅ Precheck validates before execution

## Files Created

- `/frontend/src/app/api/execute-swap/route.js` - API endpoint
- `/frontend/src/hooks/useSwapAbility.js` - Frontend hook
- `/frontend/src/components/SwapExample.js` - Usage example
