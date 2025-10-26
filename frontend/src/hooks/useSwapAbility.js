'use client';

import { useState } from 'react';
import { useVincent } from '@/context/VincentContext';

export function useSwapAbility() {
  const { jwt } = useVincent();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);

  const executeSwap = async ({ tokenFrom, tokenTo, amount, swapAgentAddress, rpcUrl, chainId }) => {
    if (!jwt) {
      throw new Error('Not authenticated. Please connect with Vincent first.');
    }

    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('/api/execute-swap', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenFrom,
          tokenTo,
          amount,
          swapAgentAddress,
          rpcUrl,
          chainId: chainId || 296, // Default to Hedera testnet chainId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Swap execution failed');
      }

      return data.result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    executeSwap,
    isExecuting,
    error,
  };
}
