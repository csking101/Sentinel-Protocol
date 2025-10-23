import { Agent } from "./BaseAgent.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import dotenv from "dotenv";
import Web3 from "web3";
import fs from "fs";

dotenv.config();

// --- Web3 + Contract Tool ---
const reputationTool = new DynamicStructuredTool({
  name: "reputation_checker",
  description: `
    Connects to an Ethereum contract and fetches on-chain reputation scores.
    Uses getAllTokens() and getScores(token) methods.
    Returns market, fundamental, risk, and reputation data for each token.
  `,
  schema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "Token name or symbol to fetch reputation for. Leave empty to get all.",
      },
    },
    required: [],
  },
  func: async ({ token }) => {
    try {
      const rpcUrl = process.env.RPC_URL;
      const contractAddress = process.env.CONTRACT_ADDRESS;
      const abiPath = process.env.ABI_PATH;
      const debug = process.env.DEBUG === "true";

      const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
      if (!(await web3.eth.net.isListening())) throw new Error("Failed to connect to RPC");

      const abi = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
      const contract = new web3.eth.Contract(abi, contractAddress);

      const scale = 1_000_000;
      let tokens = [];

      if (token) {
        tokens = [token];
      } else {
        tokens = await contract.methods.getAllTokens().call();
      }

      if (!tokens || tokens.length === 0) return "No tokens found on the contract.";

      const results = [];
      for (const t of tokens) {
        let rawData = await contract.methods.getScores(t).call();

        // Web3 sometimes returns an object instead of an array
        if (typeof rawData === "object" && !Array.isArray(rawData)) {
          rawData = Object.values(rawData).slice(0, 4);
        }

        const [market, fundamental, risk, reputation] = rawData.map(x => Number(x) / scale);

        if (debug) console.log(`[DEBUG] ${t} raw scores:`, rawData);

        results.push(
          `${t} → Market: ${market.toFixed(2)}, ` +
          `Fundamental: ${fundamental.toFixed(2)}, ` +
          `Risk: ${risk.toFixed(2)}, ` +
          `Reputation: ${reputation.toFixed(2)}`
        );
      }

      return results.join("\n");
    } catch (error) {
      return `Error fetching on-chain reputation data: ${error.message}`;
    }
  },
});

// --- Reputation Decision Agent ---
export class ReputationDecisionAgent extends Agent {
  constructor(name = "ReputationDecisionAgent") {
    const systemPrompt = `
      You are a blockchain analyst agent.
      You always fetch on-chain reputation scores using the 'reputation_checker' tool before giving advice.
      Provide a short explanation and recommendation based on the scores.
    `;
    super(name, systemPrompt, [reputationTool], true);
  }

  async assessReputation(query) {
    return this.run(query);
  }
}

// --- Example usage ---
// (async () => {
//   const agent = new ReputationDecisionAgent();
//   const result = await agent.assessReputation(
//     "Which tokens currently have the worst on-chain reputation?"
//   );
//   console.log("🤖 Agent Output:\n", result);
// })();
