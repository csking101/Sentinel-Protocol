import { Agent } from "./BaseAgent.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";

// --- Authorization Tool ---
const authorizationTool = new DynamicStructuredTool({
  name: "authorize_action",
  description: `
    Validates whether a proposed action (swap/stake/unstake) is allowed based on user settings.
    Input is a JSON describing the requested action.
  `,
  schema: {
    type: "object",
    properties: {
      action: { type: "object", description: "The action to validate" },
      userSettings: { type: "object", description: "User-specific permissions and limits" },
    },
    required: ["action", "userSettings"],
  },
  func: async ({ action, userSettings }) => {
    if (!action || Object.keys(action).length === 0) {
      return { authorized: false, reason: "No action specified." };
    }

    try {
      const { type, fromToken, toToken, amount } = action;
      const { allowedActions, allowedTokens, maxSwapPercentage } = userSettings;

      if (!allowedActions.includes(type)) {
        return { authorized: false, reason: `Action type '${type}' not allowed.` };
      }

      if (type === "swap") {
        if (!allowedTokens.includes(fromToken) || !allowedTokens.includes(toToken)) {
          return { authorized: false, reason: `One of the tokens '${fromToken}' or '${toToken}' is not allowed.` };
        }
        if (amount > maxSwapPercentage / 100) {
          return { authorized: false, reason: `Swap amount exceeds max allowed percentage (${maxSwapPercentage}%).` };
        }
      }

      // Can extend for stake/unstake or other rules

      return { authorized: true, reason: "Action is authorized." };
    } catch (err) {
      return { authorized: false, reason: `Error validating action: ${err.message}` };
    }
  },
});

// --- Authorization Agent ---
export class AuthorizationAgent extends Agent {
  constructor(name = "AuthorizationAgent") {
    const systemPrompt = `
      You validate if a proposed financial action is allowed by the user's settings.
      Always respond with JSON containing 'authorized' (boolean) and 'reason' (string).
      If action is unauthorized, provide guidance for correction.
    `;
    super(name, systemPrompt, [], true); // No tools in BaseAgent

    // LLM for explanations
    this.explainerModel = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
      maxOutputTokens: 300,
    });
  }

  // Main function
  async authorizeAction(action, userSettings) {
    const result = await authorizationTool._call({ action, userSettings });

    // If unauthorized, call LLM for explanation
    if (!result.authorized) {
      const explainerPrompt = [
        { role: "system", content: "You are a helpful blockchain assistant." },
        {
          role: "user",
          content: `
The following action was attempted:
${JSON.stringify(action, null, 2)}

The user settings are:
${JSON.stringify(userSettings, null, 2)}

The system rule check returned:
${JSON.stringify(result, null, 2)}

Please provide a concise explanation why this action is not allowed and suggest a possible fix.
          `,
        },
      ];

      const llmResponse = await this.explainerModel.generate([explainerPrompt]);
      const text = llmResponse.generations[0][0].text;

      return {
        ...result,
        llmSuggestion: text,
      };
    }

    return result;
  }
}

// --- Example Usage / Test Cases ---
(async () => {
  const agent = new AuthorizationAgent();

  const userSettings = {
    maxSwapPercentage: 50,
    allowedTokens: ["ETH", "AAVE", "USDC"],
    allowedActions: ["swap", "stake", "unstake"],
  };

  const testActions = [
    {
      name: "Valid swap",
      action: { type: "swap", fromToken: "ETH", toToken: "AAVE", amount: 0.4, unit: "ETH", reason: "Portfolio rebalance", timestamp: Date.now() },
    },
    {
      name: "Exceed swap limit",
      action: { type: "swap", fromToken: "ETH", toToken: "AAVE", amount: 0.6, unit: "ETH", reason: "Portfolio rebalance", timestamp: Date.now() },
    },
    {
      name: "Invalid token",
      action: { type: "swap", fromToken: "BTC", toToken: "ETH", amount: 0.1, unit: "BTC", reason: "Test", timestamp: Date.now() },
    },
    {
      name: "Disallowed action",
      action: { type: "burn", fromToken: "ETH", toToken: "AAVE", amount: 0.1, unit: "ETH", reason: "Test", timestamp: Date.now() },
    },
  ];

  for (const t of testActions) {
    console.log(`\n--- Test Case: ${t.name} ---`);
    const result = await agent.authorizeAction(t.action, userSettings);
    console.log("Action:", t.action);
    console.log("Result:", result);
  }
})();
