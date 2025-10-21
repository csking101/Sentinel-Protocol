'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function AgentOperationsCard({ operation, index }) {
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

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high':
        return 'text-rose-600';
      case 'medium':
        return 'text-amber-600';
      default:
        return 'text-emerald-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'pending':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
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

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-2xl border-2 border-black/15 overflow-hidden"
    >
      {/* Minimal Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(operation.status)}`} />
              <span className="text-xs text-gray-500 font-medium">{operation.timestamp}</span>
            </div>
            <h3 className="font-bold text-xl text-black">{operation.type}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 ${getRiskColor(operation.risk)}`} />
            <span className={`text-xs font-semibold ${getRiskColor(operation.risk)}`}>
              {operation.risk.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Clean Swap Flow */}
      <div className="px-6 pb-6">
        {operation.swaps.map((swap, idx) => (
          <div key={idx} className="mb-5">
            <div className="flex items-center gap-6">
              {/* From Token - Minimal */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-black/10 flex items-center justify-center overflow-hidden">
                    <Image
                      src={getTokenImage(swap.from)}
                      alt={swap.from}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-base font-bold text-black">{swap.fromAmount} {swap.from}</p>
                    <p className="text-xs text-gray-400">${swap.fromValue}</p>
                  </div>
                </div>
              </div>

              {/* Simple Arrow */}
              {/* <div className="bg-black p-1.5 rounded-lg"> */}
              <ArrowRight className="w-6 h-6 text-black shrink-0" />
              {/* </div> */}

              {/* To Token - Minimal */}
              <div className="flex-1 flex justify-end">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-base font-bold text-black">{swap.toAmount} {swap.to}</p>
                    <p className="text-xs text-gray-400">${swap.toValue}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-black/10 flex items-center justify-center overflow-hidden">
                    <Image
                      src={getTokenImage(swap.to)}
                      alt={swap.to}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Single Text Block - Reasoning */}
        <div className="pt-4 border-t border-black/10">
          <p className="text-sm text-gray-600 leading-relaxed">
            {operation.reason}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
