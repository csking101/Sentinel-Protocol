/**
 * Hedera EVM Network Configuration
 * 
 * This module provides configuration and utilities for connecting to
 * the Hedera EVM-compatible network.
 */

// Network configurations
export const HEDERA_NETWORKS = {
  testnet: {
    chainId: '0x128', // 296 in hex
    chainIdDecimal: 296,
    chainName: 'Hedera Testnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    rpcUrls: [process.env.NEXT_PUBLIC_HEDERA_RPC_URL || 'https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet'],
  },
  mainnet: {
    chainId: '0x127', // 295 in hex
    chainIdDecimal: 295,
    chainName: 'Hedera Mainnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    rpcUrls: [process.env.NEXT_PUBLIC_HEDERA_RPC_URL || 'https://mainnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/mainnet'],
  },
};

// Get current network from environment
export const getCurrentNetwork = () => {
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  return HEDERA_NETWORKS[network];
};

// Get chain ID from environment
export const getChainId = () => {
  return process.env.NEXT_PUBLIC_HEDERA_CHAIN_ID || '296';
};

// Get RPC URL from environment
export const getRpcUrl = () => {
  return process.env.NEXT_PUBLIC_HEDERA_RPC_URL || 'https://testnet.hashio.io/api';
};

// Get contract addresses
export const getContractAddress = (contractName) => {
  const addresses = {
    tokenReputation: process.env.NEXT_PUBLIC_TOKEN_REPUTATION_CONTRACT_ADDRESS,
  };
  return addresses[contractName];
};

/**
 * Switch to Hedera network in MetaMask
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export const switchToHederaNetwork = async () => {
  if (typeof window.ethereum === 'undefined') {
    console.error('MetaMask is not installed');
    return false;
  }

  const network = getCurrentNetwork();
  
  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainId }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add the network to MetaMask
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [network],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Hedera network:', addError);
        return false;
      }
    }
    console.error('Failed to switch to Hedera network:', switchError);
    return false;
  }
};

/**
 * Check if user is on the correct Hedera network
 * @returns {Promise<boolean>}
 */
export const isOnHederaNetwork = async () => {
  if (typeof window.ethereum === 'undefined') {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const expectedChainId = getCurrentNetwork().chainId;
    return chainId === expectedChainId;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

/**
 * Connect wallet and ensure it's on the correct network
 * @returns {Promise<{address: string, isCorrectNetwork: boolean}>}
 */
export const connectWallet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('Please install MetaMask to use this application');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    // Check if on correct network
    const correctNetwork = await isOnHederaNetwork();

    if (!correctNetwork) {
      // Try to switch to correct network
      const switched = await switchToHederaNetwork();
      return {
        address: accounts[0],
        isCorrectNetwork: switched,
      };
    }

    return {
      address: accounts[0],
      isCorrectNetwork: true,
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

/**
 * Format address for display (0x1234...5678)
 * @param {string} address 
 * @param {number} startChars 
 * @param {number} endChars 
 * @returns {string}
 */
export const formatAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Listen for network changes
 * @param {Function} callback - Called when network changes
 * @returns {Function} - Cleanup function
 */
export const onNetworkChange = (callback) => {
  if (typeof window.ethereum === 'undefined') {
    return () => {};
  }

  const handleChainChanged = (chainId) => {
    callback(chainId);
  };

  window.ethereum.on('chainChanged', handleChainChanged);

  // Return cleanup function
  return () => {
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  };
};

/**
 * Listen for account changes
 * @param {Function} callback - Called when accounts change
 * @returns {Function} - Cleanup function
 */
export const onAccountChange = (callback) => {
  if (typeof window.ethereum === 'undefined') {
    return () => {};
  }

  const handleAccountsChanged = (accounts) => {
    callback(accounts[0] || null);
  };

  window.ethereum.on('accountsChanged', handleAccountsChanged);

  // Return cleanup function
  return () => {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
  };
};
