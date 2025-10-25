'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { VincentAppClient } from '@lit-protocol/vincent-app-sdk';

const VincentContext = createContext(null);

export function VincentProvider({ children }) {
  const [vincentClient, setVincentClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState(null);

  // Initialize Vincent client on mount
  useEffect(() => {
    try {
      const client = new VincentAppClient();
      setVincentClient(client);
    } catch (err) {
      console.error('Failed to initialize Vincent client:', err);
      setError(err.message);
    }
  }, []);

  const connect = async () => {
    if (!vincentClient) {
      setError('Vincent client not initialized');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Initiate Vincent Connect flow
      const result = await vincentClient.connect();
      
      if (result && result.address) {
        setWalletAddress(result.address);
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Failed to connect with Vincent:', err);
      setError(err.message);
      setIsConnected(false);
      setWalletAddress(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (vincentClient) {
        await vincentClient.disconnect();
      }
      setIsConnected(false);
      setWalletAddress(null);
      setError(null);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError(err.message);
    }
  };

  const value = {
    vincentClient,
    isConnected,
    isConnecting,
    walletAddress,
    error,
    connect,
    disconnect,
  };

  return (
    <VincentContext.Provider value={value}>
      {children}
    </VincentContext.Provider>
  );
}

export function useVincent() {
  const context = useContext(VincentContext);
  if (!context) {
    throw new Error('useVincent must be used within a VincentProvider');
  }
  return context;
}
