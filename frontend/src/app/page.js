'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import TokenCard from '@/components/TokenCard';
import AgentOperationsCard from '@/components/AgentOperationsCard';
import { motion } from 'framer-motion';
import { Wallet, Activity } from 'lucide-react';

// Mock data - Replace with actual API calls
const generatePriceHistory = (basePrice, volatility) => {
  const history = [];
  let price = basePrice;
  for (let i = 0; i < 24; i++) {
    price += (Math.random() - 0.5) * volatility;
    history.push({
      time: `${i}:00`,
      price: Math.max(price, 0),
    });
  }
  return history;
};

const mockTokens = [
  {
    name: 'Ethereum',
    symbol: 'ETH',
    balance: 2.5431,
    price: 2842.53,
    change: 3.24,
    color: 'bg-linear-to-br from-purple-500 to-indigo-600',
    reputationScore: 92,
    priceHistory: generatePriceHistory(2842.53, 50),
  },
  {
    name: 'Dogecoin',
    symbol: 'DOGE',
    balance: 15420.87,
    price: 0.0821,
    change: -2.15,
    color: 'bg-linear-to-br from-yellow-500 to-orange-500',
    reputationScore: 58,
    priceHistory: generatePriceHistory(0.0821, 0.005),
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    balance: 5000.0,
    price: 1.0,
    change: 0.01,
    color: 'bg-linear-to-br from-blue-500 to-cyan-500',
    reputationScore: 98,
    priceHistory: generatePriceHistory(1.0, 0.002),
  },
  {
    name: 'Polygon',
    symbol: 'MATIC',
    balance: 3250.42,
    price: 0.6834,
    change: 5.67,
    color: 'bg-linear-to-br from-purple-600 to-pink-500',
    reputationScore: 75,
    priceHistory: generatePriceHistory(0.6834, 0.03),
  },
  {
    name: 'Aave',
    symbol: 'AAVE',
    balance: 45.23,
    price: 142.86,
    change: -1.43,
    color: 'bg-linear-to-br from-teal-500 to-emerald-600',
    reputationScore: 84,
    priceHistory: generatePriceHistory(142.86, 8),
  },
];

const mockOperations = [
  {
    type: 'Multi-Token Hedge',
    timestamp: '2 hours ago',
    status: 'completed',
    risk: 'high',
    riskDescription:
      'High market volatility detected across multiple altcoins',
    reason:
      'Market analysis detected increased volatility in DOGE and MATIC due to broader crypto market downturn and negative sentiment on social media. Swapping to USDC reduces exposure to volatility and protects capital.',
    swaps: [
      {
        from: 'DOGE',
        to: 'USDC',
        fromAmount: '5,420.00',
        toAmount: '445.10',
        fromValue: '445.10',
        toValue: '445.10',
      },
      {
        from: 'ETH',
        to: 'USDC',
        fromAmount: '0.5000',
        toAmount: '1,421.27',
        fromValue: '1,421.27',
        toValue: '1,421.27',
      },
    ],
  },
  {
    type: 'Risk Mitigation',
    timestamp: '5 hours ago',
    status: 'completed',
    risk: 'medium',
    riskDescription: 'Moderate risk from anticipated regulatory news',
    reason:
      'Anticipated regulatory announcement regarding DeFi protocols prompted a strategic move from AAVE to USDC. This preserves capital while maintaining liquidity for re-entry when market stabilizes.',
    swaps: [
      {
        from: 'AAVE',
        to: 'USDC',
        fromAmount: '12.5000',
        toAmount: '1,785.75',
        fromValue: '1,785.75',
        toValue: '1,785.75',
      },
    ],
  },
  {
    type: 'Opportunity Swap',
    timestamp: '1 day ago',
    status: 'completed',
    risk: 'low',
    riskDescription: 'Low risk rebalancing based on positive market signals',
    reason:
      'Strong bullish signals detected for ETH following successful network upgrade. Swapping from stable USDC to ETH to capitalize on anticipated price appreciation while market sentiment is positive.',
    swaps: [
      {
        from: 'USDC',
        to: 'ETH',
        fromAmount: '2,000.00',
        toAmount: '0.7036',
        fromValue: '2,000.00',
        toValue: '2,000.00',
      },
    ],
  },
];

export default function Home() {
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    // In production, fetch actual token data from wallet
    if (connectedAddress) {
      setTokens(mockTokens);
    }
  }, [connectedAddress]);

  const totalPortfolioValue = tokens.reduce(
    (acc, token) => acc + token.balance * token.price,
    0
  );

  // Calculate total value controlled by agent (assuming 50% default for each token)
  const totalControlledValue = tokens.reduce(
    (acc, token) => acc + (token.balance * token.price * 50) / 100,
    0
  );

  return (
    <div className="min-h-screen bg-white">
      <Header
        onConnect={setConnectedAddress}
        connectedAddress={connectedAddress}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!connectedAddress ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <div className="bg-black p-12 rounded-3xl mb-8 border-2 border-black">
              <Wallet className="w-24 h-24 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-black mb-4 tracking-tight">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 text-center max-w-md font-medium mb-8 text-lg">
              Connect your MetaMask wallet to start protecting your crypto
              assets with intelligent AI-powered risk management.
            </p>
            <button
              onClick={() => {
                if (typeof window.ethereum !== 'undefined') {
                  window.ethereum.request({
                    method: 'eth_requestAccounts',
                  }).then((accounts) => {
                    setConnectedAddress(accounts[0]);
                  });
                } else {
                  alert('Please install MetaMask to use this application');
                }
              }}
              className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-base transition-all border-2 bg-black text-white border-black hover:bg-gray-800"
            >
              <Wallet className="w-6 h-6" />
              Connect Wallet
            </button>
          </motion.div>
        ) : (
          <>
            {/* Portfolio Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 mb-8 border-2 border-black/15"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-2 uppercase tracking-wider">
                    Total Portfolio Value
                  </p>
                  <p className="text-4xl font-bold text-black">
                    ${totalPortfolioValue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-2 uppercase tracking-wider">
                    Value Controlled by Agent
                  </p>
                  <p className="text-4xl font-bold text-black">
                    ${totalControlledValue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-2 uppercase tracking-wider">
                    Active Assets
                  </p>
                  <p className="text-4xl font-bold text-black">{tokens.length}</p>
                </div>
              </div>
            </motion.div>

            {/* Your Wallet Section */}
            <section className="mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="bg-black p-2 rounded-xl">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-black tracking-tight">
                  Your Wallet
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tokens.map((token, index) => (
                  <TokenCard key={token.symbol} token={token} index={index} />
                ))}
              </div>
            </section>

            {/* Agent Operations Section */}
            <section>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="bg-black p-2 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-black tracking-tight">
                  Agent Operations
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 gap-6">
                {mockOperations.map((operation, index) => (
                  <AgentOperationsCard
                    key={index}
                    operation={operation}
                    index={index}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
