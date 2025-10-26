'use client';

import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useVincent } from '@/context/VincentContext';

export default function Header() {
  const { isConnected, isConnecting, walletAddress, connect, error } = useVincent();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full sticky top-0 z-50 backdrop-blur-md bg-white/95"
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative">
            <Image
              src="/logo_2.png"
              alt="Sentinel Protocol"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight">
              Sentinel Protocol
            </h1>
            <p className="text-xs text-gray-600 font-medium tracking-wide">
              INTELLIGENT ASSET PROTECTION
            </p>
          </div>
        </div>

        {/* Only show wallet address button when connected */}
        {isConnected && (
          <div className="flex items-center gap-3">
            {error && (
              <div className="text-red-600 text-sm font-medium mr-2">
                {error}
              </div>
            )}
            
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all border-2 bg-black text-white border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="w-5 h-5" />
              {formatAddress(walletAddress)}
            </button>
          </div>
        )}
      </div>
    </motion.header>
  );
}
