'use client';

import { useState } from 'react';
import { useVincent } from '@/context/VincentContext';

export function useERC20Approval() {
  const { jwt } = useVincent();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState(null);

  const approveToken = async ({ tokenAddress, spenderAddress, amount, rpcUrl, chainId }) => {
    if (!jwt) {
      throw new Error('Not authenticated. Please connect with Vincent first.');
    }

    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch('/api/approve-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          spenderAddress,
          amount,
          rpcUrl,
          chainId: chainId || 296, // Default to Hedera testnet chainId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token approval failed');
      }

      return data.result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsApproving(false);
    }
  };

  return {
    approveToken,
    isApproving,
    error,
  };
}
