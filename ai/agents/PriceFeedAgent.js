import { Agent } from "./BaseAgent.js";
import { DynamicStructuredTool } from "@langchain/core/tools";

const priceFeedTool = new DynamicStructuredTool({
  name: "price_feed",
  description: "Fetch live crypto prices from CoinGecko given a coin ID (e.g. 'bitcoin', 'ethereum').",
  schema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "The coin ID, like 'bitcoin' or 'ethereum'.",
      },
    },
    required: ["symbol"],
  },
  func: async ({ symbol }) => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
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
    super(
      name,
      "You are a crypto assistant. When asked about prices, use the price_feed tool to fetch live prices from CoinGecko.",
      [priceFeedTool]
    );
  }

  async getPrice(symbol) {
    return await this.run(`What is the price of ${symbol}?`);
  }
}

// --- Example usage ---
(async () => {
  const agent = new PriceFeedAgent();
  console.log(await agent.getPrice("bitcoin"));
})();
