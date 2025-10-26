import { Agent } from "./BaseAgent.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// --- Decision Tool ---
const decisionTool = new DynamicStructuredTool({
  name: "generate_action",
  description: `
    Generates a proposed action (swap/stake/unstake) based on a query. If no action, make the amount as 0
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
  func: async ({ query,portfolio }) => {
    try {
      const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.5,
        maxOutputTokens: 300,
      });

      const messages = [
        new SystemMessage(
          "You are a financial assistant that outputs ONLY valid JSON actions with no extra text. Your reasons must align with the trigger reason, and be elaborate on why the action makes sense. Remember that you are a WORLD CLASS TRADER and FINANCIAL ADVISOR. DON'T BUY OR SELL RANDOM ASSETS, MAKE SMALL TRADES THAT MAKE SENSE BASED ON THE CONTEXT PROVIDED. IF YOU HAVE NEWS ABOUT A CERTAIN ASSET, FACTOR THAT IN YOUR REASONING. ALWAYS THINK ABOUT RISK MANAGEMENT AND DIVERSIFICATION. THE GOAL IS TO MAINTAIN THE PORTFOLIO VALUE AND PROTECT AGAINST MARKET CRASHES.DON'T LET COINS OUTSIDE YOUR PORTFOLIO AFFECT YOUR DECISION. IF YOU DON'T SEE A REASON TO TRADE, THEN MAKE THE AMOUNT 0."
        ),
        new HumanMessage(`
Given the following query, output a JSON with the action type (swap/stake/unstake),
fromToken, toToken, amount, unit, reason, and timestamp (in milliseconds):

Query: "${query}"

User Portfolio Context: ${JSON.stringify(portfolio)}

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

const feedTool = new DynamicStructuredTool({
      name: "choose_feeds",
      description: "Determines which data feeds are required based on the user query.",
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
            maxOutputTokens: 200,
          });

          const messages = [
            new SystemMessage(
              "You are an assistant that determines required data feeds based on user queries. If you are unsure, then you should take all the fields as input."
            ),
            new HumanMessage(`
Given the following query, output a JSON indicating which data feeds are required:

Query: "${query}"

Based on the user query, determine which data feeds are required:
      - Price Feed
      - News Feed
      - Reputation Feed

      Output a JSON object with boolean fields for each feed, e.g.:
      {
        priceFeed: true,
        newsFeed: false,
        reputationFeed: true
      }


Output MUST be valid JSON with boolean fields: priceFeed, newsFeed, reputationFeed.
Do NOT include explanations or markdown. If you're unsure, see all the fields.
            `)
          ];

          const response = await llm.generate([messages]);
          let jsonText = response.generations[0][0].text.trim();

          // Remove code block backticks if present
          if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```(?:json)?/g, "").trim();
          }

          return JSON.parse(jsonText);
        } catch (err) {
          return { error: `Failed to determine feeds: ${err.message}` };
        }
      }
    });

// --- Decision Agent ---
export class DecisionAgent extends Agent {
  constructor(name = "DecisionAgent") {
    const systemPrompt = `
      You propose financial actions based on user queries.
      Always generate actions in structured JSON using the 'generate_action' tool. Make sure your proposed action is inline with the trigger reason. It has to make sense. Remember that you are a WORLD CLASS TRADER and FINANCIAL ADVISOR. For example, if the price of ETH is going down, then you should consider proposing to swap ETH for a stablecoin like USDC. 
    `;
    super(name, systemPrompt, [decisionTool], false);
  }

  async chooseRequiredFeed(query){
    return await feedTool._call({ query });
  }

  // Basic proposal using the decision tool
  async proposeAction(query, portfolio) {
    return await decisionTool._call({ query, portfolio });
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
