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
      query: {
        type: "string",
        description: "User query describing the desired action"
      }
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
          "You are a financial assistant that outputs structured actions in JSON."
        ),
        new HumanMessage(`
Given the following query, output a JSON with the action type (swap/stake/unstake),
fromToken, toToken, amount, unit, reason, and timestamp (in milliseconds):

Query: "${query}"

The output must be valid JSON with no extra text.
        `)
      ];

      const response = await llm.generate([[...messages]]);
      const jsonText = response.generations[0][0].text.trim();

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

  async proposeAction(query) {
    return decisionTool._call({ query });
  }
}

// --- Example usage ---
(async () => {
  const agent = new DecisionAgent();

  const queries = [
    "Swap 0.5 ETH to AAVE to rebalance my portfolio.",
    "Stake 100 USDC into AAVE savings.",
    "Unstake 50 AAVE for ETH liquidity."
  ];

  for (const q of queries) {
    console.log("Query:", q);
    const result = await agent.proposeAction(q);
    console.log("Proposed action:", result);
    console.log("────────────────────────────");
  }
})();
