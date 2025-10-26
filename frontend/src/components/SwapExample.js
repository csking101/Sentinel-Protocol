'use client';

import { useState } from 'react';
import { useSwapAbility } from '@/hooks/useSwapAbility';
import { useERC20Approval } from '@/hooks/useERC20Approval';

export default function SwapExample() {
  const { executeSwap, isExecuting: isSwapping, error: swapError } = useSwapAbility();
  const { approveToken, isApproving, error: approvalError } = useERC20Approval();
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');

  const handleApproveAndSwap = async () => {
    try {
      const tokenFrom = '0x575Ce3448217fE6451654801e776115081F97020'; // StableCoin
      const tokenTo = '0x5bf5d13184623EEB526490f4dc1238e8e71b96Cc'; // MemeCoin
      const amount = '100000000000000000000000'; // Amount in wei
      const swapAgentAddress = '0x7687975b001e148fF34B04a835E769eAdB94923B';
      const rpcUrl = 'https://testnet.hashio.io/api';
      const chainId = 296;

      // Step 1: Approve the SwapAgent to spend tokens
      setStatus('Approving token spend...');
      console.log('Step 1: Approving token spend...');
      
      const approvalResult = await approveToken({
        tokenAddress: tokenFrom,
        spenderAddress: swapAgentAddress,
        amount: amount, // Approve the exact amount we want to swap
        rpcUrl,
        chainId,
      });

      console.log('Approval successful:', approvalResult);
      setStatus('Approval successful! Executing swap...');

      // Step 2: Execute the swap
      console.log('Step 2: Executing swap...');
      
      const swapResult = await executeSwap({
        tokenFrom,
        tokenTo,
        amount,
        swapAgentAddress,
        rpcUrl,
        chainId,
      });

      setResult(swapResult);
      setStatus('Swap completed successfully!');
      console.log('Swap successful:', swapResult);
    } catch (err) {
      console.error('Operation failed:', err);
      setStatus(`Failed: ${err.message}`);
    }
  };

  const isExecuting = isApproving || isSwapping;
  const error = approvalError || swapError;

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h2 className="text-2xl font-bold mb-4">Execute Token Swap with Approval</h2>
      
      <div className="mb-4 text-sm text-gray-600">
        <p>This will:</p>
        <ol className="list-decimal list-inside ml-2 mt-2">
          <li>Approve SwapAgent to spend 10 StableCoin</li>
          <li>Execute swap: 10 STBL → MEME</li>
        </ol>
      </div>

      <button
        onClick={handleApproveAndSwap}
        disabled={isExecuting}
        className="px-6 py-3 bg-black text-white rounded-lg disabled:opacity-50 hover:bg-gray-800"
      >
        {isExecuting ? 'Processing...' : 'Approve & Swap Tokens'}
      </button>

      {status && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800">{status}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-bold text-green-800 mb-2">Swap Successful!</h3>
          <p className="text-sm">Transaction Hash: {result.txHash}</p>
          <p className="text-sm">Amount In: {result.amountIn}</p>
          <p className="text-sm">Amount Out: {result.amountOut}</p>
        </div>
      )}
    </div>
  );
}
