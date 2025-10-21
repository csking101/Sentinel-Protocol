'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  LineChart,
  Line,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TokenCard({ token, index }) {
  const [controlPercentage, setControlPercentage] = useState(50);

  const controlledAmount = (token.balance * controlPercentage) / 100;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.08,
      },
    },
  };

  const getTokenImage = (symbol) => {
    const imageMap = {
      'ETH': '/ethereum.png',
      'DOGE': '/dogecoin.png',
      'USDC': '/usdc.png',
      'MATIC': '/polygon.png',
      'AAVE': '/aave.png',
    };
    return imageMap[symbol] || '/ethereum.png';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-2xl border-2 border-black/15 overflow-hidden"
    >
      {/* Clean Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-black/10 flex items-center justify-center overflow-hidden">
              <Image
                src={getTokenImage(token.symbol)}
                alt={token.name}
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-lg text-black">{token.symbol}</h3>
              <p className="text-xs text-gray-500">{token.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-black">
              ${token.price.toLocaleString()}
            </p>
            <div
              className={`flex items-center justify-end gap-1 text-xs font-semibold ${
                token.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {token.change >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {token.change >= 0 ? '+' : ''}{token.change}%
            </div>
          </div>
        </div>

        {/* Simple Balance */}
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-gray-500">Balance</span>
          <span className="text-sm font-bold text-black">
            {token.balance.toFixed(4)} {token.symbol}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-gray-500">Value</span>
          <span className="text-base font-bold text-black">
            ${(token.balance * token.price).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Minimal Chart */}
      <div className="px-6 pb-4">
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={token.priceHistory}>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'white',
                padding: '6px 10px',
              }}
              itemStyle={{
                color: 'white',
              }}
              labelStyle={{
                display: 'none',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={token.change >= 0 ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Control - Cleaner */}
      <div className="px-6 pb-6 border-t border-black/10 pt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">Agent Control</span>
          <span className="text-lg font-bold text-black">{controlPercentage}%</span>
        </div>

        <div className="relative mb-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-black"
              initial={{ width: '50%' }}
              animate={{ width: `${controlPercentage}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={controlPercentage}
            onChange={(e) => setControlPercentage(Number(e.target.value))}
            className="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-gray-500">Controlled</span>
            <span className="font-semibold text-black">
              {controlledAmount.toFixed(4)} {token.symbol}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-gray-500">Value</span>
            <span className="font-semibold text-black">
              ${(controlledAmount * token.price).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Score Bar - Minimal */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Safety Score</span>
          <span className={`text-sm font-bold ${getScoreColor(token.reputationScore)}`}>
            {token.reputationScore}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${token.reputationScore}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
            className={`h-full ${getScoreBg(token.reputationScore)}`}
          />
        </div>
      </div>
    </motion.div>
  );
}
