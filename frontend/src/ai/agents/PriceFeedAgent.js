import { Agent } from "./BaseAgent.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import dotenv from "dotenv";

dotenv.config();

const priceFeedTool = new DynamicStructuredTool({
  name: "price_feed",
  description: `Fetch live crypto prices from CoinGecko given a coin ID and the time window.
  
  The available coins IDs are:
  - matic-network
  - aave
  - doge
  - usd-coin
  - ethereum

  The time window available is:
  - 1h
  - 6h
  `
  // - 12h
  // - 1d
  // - 1w
  // - 2w
  // - 1m
  // - 3m
  // - 6m
  // - 1y
  ,
  schema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "The coin ID, like 'aave' or 'ethereum'.",
      },
      window: {
        type: "string",
        description: "The time window for the price data, like '1d' or '1w'.",
      }
    },
    required: ["symbol","window"],
  },
  func: async ({ symbol,window }) => {
    try {
      const to_timestamp = Math.floor(Date.now() / 1000);
      const from_timestamp = to_timestamp - {
        "1h": 3600,
        "6h": 21600,
        "12h": 43200,
        "1d": 86400,
        "1w": 604800,
        "2w": 1209600,
        "1m": 2592000,
        "3m": 7776000,
        "6m": 15552000,
        "1y": 31536000,
      }[window];
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&from=${from_timestamp}&to=${to_timestamp}&vs_currencies=usd`
      );
      const data = await res.json();
      if (data[symbol]) {
        return `Price of ${symbol}: $${data[symbol].usd}`;
      } else {
        return `No data found for ${symbol}`;
      }
    } catch (err) {
      return `Error fetching price: ${err.message}`;
    }
  },
});

export class PriceFeedAgent extends Agent {
  constructor(name = "PriceFeedAgent") {
    const priceFeedAgentSystemPrompt = `You are a crypto assistant. When asked about prices, use the price_feed tool to fetch live prices from CoinGecko. You will be provided with a coin ID and a time window to get the price data. For regular triggers, you need to think about what coins you should get prices for based on recent market movements.`;
    super(
      name,
      priceFeedAgentSystemPrompt,
      [priceFeedTool],
      false
    );
  }

  async getPrice(symbol) {
    return await this.run(`What is the price of ${symbol}?`);
  }

  async getAllPrices() {
    return await this.run(`Get me the latest prices for matic-network, aave, doge, usd-coin, and ethereum for the 1d time window.`);
  }

  async getResponse(query) {
    return await this.run(query);
  }
}

// --- Example usage ---
// (async () => {
//   const agent = new PriceFeedAgent();
//   console.log(await agent.getPrice("aave"));
// })();

// (async () => {
//   const url = 'https://api.coingecko.com/api/v3/coins/aave/market_chart/range?from=1761057192&to=1763721992&vs_currency=usd';
// const options = {method: 'GET', headers: {'x-cg-demo-api-key': ''}, body: undefined};

// try {
//   const response = await fetch(url, options);
//   const data = await response.json();
//   console.log(data);
// } catch (error) {
//   console.error(error);
// }
// })();