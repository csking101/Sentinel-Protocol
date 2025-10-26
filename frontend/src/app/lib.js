// lib/loadTokens.js
'use server'; // This makes sure this file is server-only

import fs from 'fs';
import path from 'path';

// Path to cache file
const CACHE_FILE = path.resolve('./tokenCache.json');

// Token definitions
const tokens = [
  { name: 'Ethereum', symbol: 'ETH', balance: 2.5431, coinId: 'ethereum', color: 'bg-linear-to-br from-purple-500 to-indigo-600', reputationScore: 92 },
  { name: 'Dogecoin', symbol: 'DOGE', balance: 15420.87, coinId: 'dogecoin', color: 'bg-linear-to-br from-yellow-500 to-orange-500', reputationScore: 58 },
  { name: 'Polygon', symbol: 'MATIC', balance: 3250.42, coinId: 'polygon-ecosystem-token', color: 'bg-linear-to-br from-purple-600 to-pink-500', reputationScore: 75 },
  { name: 'Aave', symbol: 'AAVE', balance: 45.23, coinId: 'aave', color: 'bg-linear-to-br from-teal-500 to-emerald-600', reputationScore: 84 },
  { name: 'USD Coin', symbol: 'USDC', balance: 5000.0, coinId: 'usd-coin', color: 'bg-linear-to-br from-blue-500 to-cyan-500', reputationScore: 98 },
];

// Fallback random price history
const generateFallbackHistory = (currentPrice = 1, points = 7, volatility = 0.05) => {
  const history = [];
  for (let i = 0; i < points; i++) {
    const price = currentPrice * (1 + (Math.random() - 0.5) * volatility);
    const date = new Date();
    date.setDate(date.getDate() - (points - i - 1));
    history.push({ time: `${date.getDate()}/${date.getMonth() + 1}`, price: parseFloat(price.toFixed(4)) });
  }
  return history;
};

// Load cache from JSON
const loadCache = () => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn("Failed to read cache file", error);
  }
  return [];
};

// Save cache to JSON
const saveCache = (tokensData) => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(tokensData, null, 2));
  } catch (error) {
    console.error("Failed to write cache file", error);
  }
};

// Fetch from CoinGecko with fallback
const fetchPriceHistory = async (coinId, currency = "usd", days = 7) => {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
    );
    const data = await res.json();

    if (!data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
      throw new Error("No valid price data");
    }

    return data.prices.map(([timestamp, price]) => {
      const date = new Date(timestamp);
      return { time: `${date.getDate()}/${date.getMonth() + 1}`, price };
    });
  } catch (error) {
    console.warn(`Failed to fetch ${coinId} from API, using cache/fallback.`);
    const cache = loadCache();
    const cachedToken = cache.find(t => t.coinId === coinId);
    if (cachedToken && cachedToken.priceHistory?.length) {
      return cachedToken.priceHistory;
    }
    return generateFallbackHistory();
  }
};

// Main function to get tokens (server-side)
export const loadTokens = async () => {
  const enrichedTokens = await Promise.all(
    tokens.map(async (token) => {
      const priceHistory = await fetchPriceHistory(token.coinId);
      const latestPrice = priceHistory.length ? priceHistory[priceHistory.length - 1].price : 1;
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

  saveCache(enrichedTokens); // update cache

  return enrichedTokens;
};
