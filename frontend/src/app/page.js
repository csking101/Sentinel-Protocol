'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import TokenCard from '@/components/TokenCard';
import AgentOperationsCard from '@/components/AgentOperationsCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Activity } from 'lucide-react';

// Token definitions with CoinGecko IDs
const tokens = [
  { name: 'Ethereum', symbol: 'ETH', balance: 5.0, coinId: 'ethereum', color: 'bg-linear-to-br from-purple-500 to-indigo-600', reputationScore: 92 },
  { name: 'Dogecoin', symbol: 'DOGE', balance: 1000.23, coinId: 'dogecoin', color: 'bg-linear-to-br from-yellow-500 to-orange-500', reputationScore: 58 },
  { name: 'USD Coin', symbol: 'USDC', balance: 1000.0, coinId: 'usd-coin', color: 'bg-linear-to-br from-blue-500 to-cyan-500', reputationScore: 98 },
  { name: 'Polygon', symbol: 'MATIC', balance: 1.02, coinId: 'polygon-ecosystem-token', color: 'bg-linear-to-br from-purple-600 to-pink-500', reputationScore: 75 },
  { name: 'Aave', symbol: 'AAVE', balance: 0.001, coinId: 'aave', color: 'bg-linear-to-br from-teal-500 to-emerald-600', reputationScore: 84 },
];

// Utility: generate fallback random price history
const generateFallbackHistory = (currentPrice, points = 7, volatility = 0.05) => {
  const history = [];
  for (let i = 0; i < points; i++) {
    const price = currentPrice * (1 + (Math.random() - 0.5) * volatility);
    const date = new Date();
    date.setDate(date.getDate() - (points - i - 1));
    history.push({ time: `${date.getDate()}/${date.getMonth() + 1}`, price: parseFloat(price.toFixed(4)) });
  }
  return history;
};

// Fetch daily price history from CoinGecko (free plan)
const fetchPriceHistory = async (coinId, currency = "usd", days = 7) => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
    );
    const data = await response.json();

    if (!data.prices || !Array.isArray(data.prices)) {
      console.warn(`No price data for ${coinId}, using fallback.`);
      return generateFallbackHistory(1); // default fallback price = 1
    }

    return data.prices.map(([timestamp, price]) => {
      const date = new Date(timestamp);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return { time: `${day}/${month}`, price };
    });
  } catch (error) {
    console.error(`Error fetching ${coinId} price history:`, error);
    return generateFallbackHistory(1); // fallback
  }
};

// Main function: fetch all tokens with price history and latest price
export const loadTokens = async () => {
  const enrichedTokens = await Promise.all(
    tokens.map(async (token) => {
      const priceHistory = await fetchPriceHistory(token.coinId);
      const latestPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : 1;
      const change = priceHistory.length > 1 
        ? ((latestPrice - priceHistory[0].price) / priceHistory[0].price) * 100 
        : 0;

      return {
        ...token,
        price: parseFloat(latestPrice.toFixed(4)),
        change: parseFloat(change.toFixed(2)),
        priceHistory,
      };
    })
  );

  return enrichedTokens;
};


const initialOperations = [
  {
    type: 'Multi-Token Hedge',
    timestamp: '2 hours ago',
    status: 'completed',
    risk: 'high',
    riskDescription: 'High market volatility detected across altcoins',
    reason:
      'Volatility in DOGE and MATIC prompted a hedge to USDC to protect capital.',
    swaps: [
      { from: 'DOGE', to: 'USDC', fromAmount: '5420', toAmount: '445.1' },
      { from: 'ETH', to: 'USDC', fromAmount: '0.5', toAmount: '1421.27' },
    ],
  },{
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

// ──────────────────────────── Component ────────────────────────────
export default function Home() {
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [operations, setOperations] = useState(initialOperations);

  const [showModal, setShowModal] = useState(false);
  const [streamLogs, setStreamLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const logsContainerRef = useRef(null);
  
  const [mockTokens, setMockTokens] = useState([]);

  useEffect(() => {
    loadTokens().then(setMockTokens);
  }, []);

  // Auto-scroll logs to bottom
  useEffect(() => {
  if (logsContainerRef.current) {
    logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  }
}, [streamLogs]); // scrolls whenever new logs come in

  // Simulate live price changes
  useEffect(() => {
    if (!connectedAddress) return;
    setTokens(mockTokens);
    const interval = setInterval(() => {
      setTokens((prev) =>
        prev.map((t) => {
          const f = 1 + (Math.random() - 0.5) * 0.0002;
          const newPrice = t.price * f;
          const newHist = [...t.priceHistory.slice(1), { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), price: newPrice }];
          return { ...t, price: newPrice, change: ((newPrice - t.price) / t.price) * 100, priceHistory: newHist };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [connectedAddress]);

  // Trigger modal 10 s after connect
  useEffect(() => {
    if (!connectedAddress) return;
    const t = setTimeout(() => {
        setShowModal(true);
      }
      , 5000);
    const g = setTimeout(() => {
      setIsStreaming(true);
      startOrchestration();
    },7000);
    return () => {
      clearTimeout(t);
      clearTimeout(g);
    }
  }, [connectedAddress]);

  // ── Orchestration stream ──
  async function startOrchestration() {
    setIsStreaming(true);
    setStreamLogs([{ message: 'Starting orchestration…' }]);

    const payload = {
      triggerReason:
        "High sell activity in ETH market due to Trump's 100% China tariff announcement",
      portfolio: { ETH: 5, USDC: 1000 },
    };

    const response = await fetch('/api/agent/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.body) {
      setStreamLogs([{ msg: 'Error: No stream body' }]);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullData = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const parts = chunk.split('\n\n').filter(Boolean);

      for (const part of parts) {
        if (part.startsWith('data:')) {
          try {
            const json = JSON.parse(part.replace(/^data:\s*/, ''));
            setStreamLogs((p) => [...p, json]);
            fullData = json;
          } catch {
            console.warn('Invalid chunk:', part);
          }
        }
      }
    }

    setIsStreaming(false);
    if (fullData?.type === 'proposedAction' || fullData?.proposedAction) {
      setOperations((prev) => [
        {
          type: 'AI-Proposed Rebalance',
          timestamp: 'Just now',
          status: 'completed',
          risk: 'medium',
          riskDescription: 'Automated AI portfolio rebalance',
          reason: payload.triggerReason,
          swaps: [
            { from: 'ETH', to: 'USDC', fromAmount: '1.0', toAmount: '2800' },
          ],
        },
        ...prev,
      ]);
    }
  }

  // ── Values ──
  const totalValue = tokens.reduce(
    (a, t) => a + t.balance * t.price,
    0
  );
  const controlledValue = tokens.reduce(
    (a, t) => a + (t.balance * t.price * 0.5),
    0
  );

  // ──────────────────────────── UI ────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Header onConnect={setConnectedAddress} connectedAddress={connectedAddress} />

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
            <h2 className="text-4xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 max-w-md mb-8 text-lg text-center">
              Connect MetaMask to enable AI-powered risk management.
            </p>
            <button
              onClick={async () => {
                if (window.ethereum) {
                  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                  setConnectedAddress(accounts[0]);
                } else alert('Install MetaMask');
              }}
              className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold bg-black text-white border-2 border-black hover:bg-gray-800"
            >
              <Wallet className="w-6 h-6" /> Connect Wallet
            </button>
          </motion.div>
        ) : (
          <>
            {/* Portfolio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 mb-8 border-2 border-black/15"
            >
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-2 uppercase">
                    Total Portfolio Value
                  </p>
                  <p className="text-4xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-2 uppercase">
                    Value Controlled by Agent
                  </p>
                  <p className="text-4xl font-bold">${controlledValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-bold mb-2 uppercase">
                    Active Assets
                  </p>
                  <p className="text-4xl font-bold">{tokens.length}</p>
                </div>
              </div>
            </motion.div>

            {/* Wallet */}
            <section className="mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="bg-black p-2 rounded-xl">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Your Wallet</h2>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tokens.map((t, i) => <TokenCard key={t.symbol} token={t} index={i} />)}
              </div>
            </section>

            {/* Agent Operations */}
            <section>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="bg-black p-2 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Agent Operations</h2>
              </motion.div>

              <div className="grid gap-6">
                {operations.map((op, i) => (
                  <AgentOperationsCard key={i} operation={op} index={i} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ─────────────── Modal ─────────────── */}
      <AnimatePresence>
  {showModal && (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl p-10 max-h-[80vh] w-full max-w-lg shadow-2xl border-2 border-black"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        <h2 className="text-2xl font-bold mb-2 text-black">
          ⚠️ Market Alert — ETH Sell Activity Detected
        </h2>
        <p className="text-gray-700 mb-4 text-sm leading-relaxed">
          Trump’s 100% China tariff triggers a massive crypto crash, wiping out leveraged positions as Bitcoin, Ethereum, and Solana tumble.(<span className="italic text-gray-500">source: financialexpress.com</span>).
        </p>

        {/* Stream log area */}
        <div 
        ref={logsContainerRef}
        style={{ scrollBehavior: "smooth" }} 
        className="bg-gray-50 rounded-xl p-4 max-h-[45vh] overflow-y-auto border border-gray-200 mb-4 space-y-2">
          {streamLogs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium shadow-sm border
                ${log.type === "agent" ? "bg-blue-100 border-blue-300 text-blue-900"
                : log.type === "decision" ? "bg-yellow-100 border-yellow-300 text-yellow-900"
                : log.type === "auth" ? "bg-green-100 border-green-300 text-green-900"
                : log.type === "error" ? "bg-red-100 border-red-300 text-red-900"
                : "bg-gray-100 border-gray-200 text-gray-800"}
              `}
            >
              <strong>{log.name || log.type?.toUpperCase() || "INFO"}:</strong>{" "}
              {log.message || JSON.stringify(log.data || log)}
            </motion.div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center">
          {!isStreaming ? (
            <button
              disabled={true}
              className="px-5 py-2 bg-black text-white rounded-xl font-semibold"
            >
              Starting Rebalance...
            </button>
          ) : (
            <button
              disabled
              className="px-5 py-2 bg-black text-white rounded-xl font-semibold"
            >
              Streaming Updates...
            </button>
          )}
          <button
            onClick={() => setShowModal(false)}
            className="px-5 py-2 bg-gray-200 rounded-xl font-semibold"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}
