import { Agent } from "./BaseAgent.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// --- Decision Tool ---
const decisionTool = new DynamicStructuredTool({
  name: "generate_action",
  description: `
    Generates a proposed action (swap/stake/unstake) based on a query.
    The output must be a valid JSON object with the following structure:
    {
      type: "swap" | "stake" | "unstake",
      fromToken: "ETH",
      toToken: "AAVE",
      amount: number,
      unit: "ETH" | "AAVE" | "USDC",
      reason: string,
      timestamp: number
    }
  `,
  schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "User query describing the desired action" }
    },
    required: ["query"],
  },
  func: async ({ query }) => {
    try {
      const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
        maxOutputTokens: 300,
      });

      const messages = [
        new SystemMessage(
          "You are a financial assistant that outputs ONLY valid JSON actions with no extra text."
        ),
        new HumanMessage(`
Given the following query, output a JSON with the action type (swap/stake/unstake),
fromToken, toToken, amount, unit, reason, and timestamp (in milliseconds):

Query: "${query}"

Output MUST be valid JSON. Do NOT include explanations or markdown.
        `)
      ];

      // Use generate() instead of call()
      const response = await llm.generate([messages]);
      let jsonText = response.generations[0][0].text.trim();

      // Remove code block backticks if present
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```(?:json)?/g, "").trim();
      }

      return JSON.parse(jsonText);
    } catch (err) {
      return { error: `Failed to generate action: ${err.message}` };
    }
  }
});

// --- Decision Agent ---
export class DecisionAgent extends Agent {
  constructor(name = "DecisionAgent") {
    const systemPrompt = `
      You propose financial actions based on user queries.
      Always generate actions in structured JSON using the 'generate_action' tool.
    `;
    super(name, systemPrompt, [decisionTool], true);
  }

  // Basic proposal using the decision tool
  async proposeAction(query) {
    return decisionTool._call({ query });
  }

  // Dynamic proposal that queries other agents up to maxQueries
  async proposeDynamicAction(userQuery, agentFunctions, maxQueries = 3) {
    let context = `User query: ${userQuery}\n\n`;
    let lastAction;

    for (let i = 0; i < maxQueries; i++) {
      context += `\nIteration ${i + 1}:\n`;

      // Optionally call reputation agent
      if (agentFunctions.getReputation) {
        const rep = await agentFunctions.getReputation(userQuery);
        context += `Reputation Data: ${JSON.stringify(rep)}\n`;
      }

      // Optionally call news agent
      if (agentFunctions.getNews) {
        const news = await agentFunctions.getNews(userQuery);
        context += `News Data: ${JSON.stringify(news)}\n`;
      }

      // Optionally call price agent
      if (agentFunctions.getPrices) {
        const prices = await agentFunctions.getPrices(userQuery);
        context += `Price Data: ${JSON.stringify(prices)}\n`;
      }

      // Ask decisionTool for an action based on accumulated context
      const actionQuery = `Based on the following context, propose a structured action in JSON:\n${context}`;
      lastAction = await this.proposeAction(actionQuery);

      // Include the proposed action in context for the next iteration
      context += `Proposed Action: ${JSON.stringify(lastAction)}\n`;
    }

    return lastAction;
  }
}

// --- Example usage ---
// (async () => {
//   const agent = new DecisionAgent();

//   const mockAgentFunctions = {
//     getReputation: async (query) => ({
//       ETH: { reputation: 0.9 },
//       AAVE: { reputation: 0.85 },
//     }),
//     getNews: async (query) => [
//       { title: "ETH rises on strong fundamentals", source: "CryptoNews" },
//       { title: "AAVE adoption grows", source: "BlockchainDaily" }
//     ],
//     getPrices: async (query) => ({
//       ETH: 1850,
//       AAVE: 65
//     }),
//   };

//   console.log("🔹 Testing proposeDynamicAction...");
//   const dynamicAction = await agent.proposeDynamicAction(
//     "Rebalance portfolio towards high-reputation assets.",
//     mockAgentFunctions,
//     3
//   );

//   console.log("🎯 Dynamic Proposed Action JSON:\n", dynamicAction);
// })();
