'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import TokenCard from '@/components/TokenCard';
import AgentOperationsCard from '@/components/AgentOperationsCard';
import { VincentProvider, useVincent } from '@/context/VincentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Activity, RefreshCw } from 'lucide-react';
import { useTokenBalances } from '@/hooks/useTokenBalances';

const initialOperations = [
  {
    type: 'Multi-Token Hedge',
    timestamp: '10 hours ago',
    status: 'completed',
    risk: 'high',
    riskDescription: 'High market volatility detected across altcoins',
    reason:
      'Sudden volatility spike in DOGE and ETH markets prompted immediate hedge to USDC to protect capital from further downside.',
    swaps: [
      { 
        from: 'DOGE', 
        to: 'USDC', 
        fromAmount: '5,420.00', 
        toAmount: '433.60',
        fromValue: '433.60',
        toValue: '433.60',
      },
      { 
        from: 'ETH', 
        to: 'USDC', 
        fromAmount: '0.5000', 
        toAmount: '1,400.00',
        fromValue: '1,400.00',
        toValue: '1,400.00',
      },
    ],
  },
  {
    type: 'Risk Mitigation',
    timestamp: '2 days ago',
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
        toAmount: '1,787.50',
        fromValue: '1,787.50',
        toValue: '1,787.50',
      },
    ],
  },
  {
    type: 'Opportunity Swap',
    timestamp: '1 week ago',
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
        toAmount: '0.7143',
        fromValue: '2,000.00',
        toValue: '2,000.00',
      },
    ],
  },
];

function HomeContent() {
  const { isConnected, walletAddress, connect, isConnecting } = useVincent();
  
  // Display balances from this wallet (using only the public address - safe!)
  const displayBalancesFrom = '0x21c048DD2EFfFBFB39B7b2B8AbcEc9446850d846';
  
  // Use the balance hook with manual refresh only (no automatic polling)
  const { tokens, setTokens, isLoadingBalances, refreshBalances, lastRefresh } = useTokenBalances(
    walletAddress ? displayBalancesFrom : null,
    0 // Disable automatic polling - manual refresh only
  );
  
  const [operations, setOperations] = useState(initialOperations);

  const [showModal, setShowModal] = useState(false);
  const [streamLogs, setStreamLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const logsContainerRef = useRef(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
  if (logsContainerRef.current) {
    logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  }
}, [streamLogs]); // scrolls whenever new logs come in

  // Simulate live price changes for fetched tokens
  useEffect(() => {
    if (!walletAddress || tokens.length === 0) return;
    
    const interval = setInterval(() => {
      setTokens((prev) =>
        prev.map((t) => {
          const f = 1 + (Math.random() - 0.5) * 0.002; // Small price fluctuation
          const newPrice = t.price * f;
          const newHist = [...t.priceHistory.slice(1), { 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            price: newPrice 
          }];
          return { 
            ...t, 
            price: newPrice, 
            change: ((newPrice - t.price) / t.price) * 100, 
            priceHistory: newHist 
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [walletAddress, tokens.length]);

  // Trigger modal 5s after connect
  useEffect(() => {
    if (!walletAddress) return;
    const t = setTimeout(() => {
        setShowModal(true);
      }
      , 60000);
    const g = setTimeout(() => {
      setIsStreaming(true);
      startOrchestration();
    },62000);
    return () => {
      clearTimeout(t);
      clearTimeout(g);
    }
  }, [walletAddress]);

  // ── Orchestration stream ──
  async function startOrchestration() {
    setIsStreaming(true);
    setStreamLogs([{ message: 'Starting orchestration…' }]);

    const payload = {
      triggerReason:
        "High sell activity in ETH market due to Trump's 100% China tariff announcement",
      portfolio: { ETH: 900.5, USDC: 4499.0, HBAR: 749.14542 },
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

  // Show loading state while checking authentication
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <div className="bg-black p-12 rounded-3xl mb-8 border-2 border-black animate-pulse">
              <Wallet className="w-24 h-24 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-4 tracking-tight">
              Checking authentication...
            </h2>
          </motion.div>
        </main> 
      </div>
    );
  }

  // ──────────────────────────── UI ────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!isConnected ? (
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
              Connect with Vincent to start protecting your crypto
              assets with intelligent AI-powered risk management.
            </p>
            <button
              onClick={connect}
              className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold bg-black text-white border-2 border-black hover:bg-gray-800"
            >
              <Wallet className="w-6 h-6" />
              {isConnecting ? 'Connecting...' : 'Connect with Vincent'}
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
                className="flex items-center justify-between mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-black p-2 rounded-xl">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Your Wallet</h2>
                </div>
                
                {/* Manual Refresh Button */}
                <button
                  onClick={refreshBalances}
                  disabled={isLoadingBalances}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Refresh balances"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingBalances ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">
                    {isLoadingBalances ? 'Refreshing...' : 'Refresh'}
                  </span>
                </button>
              </motion.div>

              {lastRefresh && (
                <p className="text-xs text-gray-500 mb-4">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              )}

              {isLoadingBalances ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading your token balances...</p>
                  </div>
                </div>
              ) : tokens.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No tokens found</h3>
                  <p className="text-gray-600">
                    This wallet doesn't have any tokens on Hedera testnet yet.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tokens.map((t, i) => <TokenCard key={t.symbol} token={t} index={i} />)}
                </div>
              )}
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

            {/* Swap Example Section */}
            {/* <section className="mt-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="bg-black p-2 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-black tracking-tight">
                  Execute Swap
                </h2>
              </motion.div>

            </section> */}
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
          ⚠️ Market Alert — ETH Buy Activity Detected
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

export default function Home() {
  return (
    <VincentProvider>
      <HomeContent />
    </VincentProvider>
  );
}
