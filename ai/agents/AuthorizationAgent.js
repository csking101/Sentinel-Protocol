import { Agent } from "./BaseAgent.js";
import { DynamicStructuredTool } from "@langchain/core/tools";

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
  const actualAction = action.action || action;
  
  if (!actualAction || Object.keys(actualAction).length === 0) {
    return { authorized: false, reason: "No action specified." };
  }
  
  console.log("Validating action:", actualAction);
  try {
    const requiredKeys = ["type", "fromToken", "toToken", "amount", "unit", "reason", "timestamp"];
    for (const key of requiredKeys) {
      if (!(key in actualAction)) {
        return { authorized: false, reason: `Missing required action field: '${key}'` };
      }
    }
    
    const { type, fromToken, toToken, amount } = actualAction;
    const { allowedActions, allowedTokens, maxSwapPercentage } = userSettings;
    
    // Check if action type is allowed
    if (!allowedActions.includes(type)) {
      return { authorized: false, reason: `Action type '${type}' not allowed.` };
    }
    
    // Swap-specific validation
    if (type === "swap") {
      if (!allowedTokens.includes(fromToken) || !allowedTokens.includes(toToken)) {
        return {
          authorized: false,
          reason: `One of the tokens '${fromToken}' or '${toToken}' is not allowed.`
        };
      }
      if (amount > maxSwapPercentage) {
        return {
          authorized: false,
          reason: `Swap amount ${amount} exceeds max allowed percentage (${maxSwapPercentage}%).`
        };
      }
    }
    
    // ✅ Action passes all checks
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
    `;
    super(name, systemPrompt, [], true); // No need to pass tools to BaseAgent
  }

  // Call the tool directly
  async authorizeAction(action, userSettings) {
    return authorizationTool._call({ action, userSettings });
  }
}

// --- Example usage ---
// (async () => {
//   const agent = new AuthorizationAgent();

//   const userSettings = {
//     maxSwapPercentage: 50,
//     allowedTokens: ["ETH", "AAVE", "USDC"],
//     allowedActions: ["swap", "stake", "unstake"],
//   };

//   const testActions = [
//     {
//       type: "swap",
//       fromToken: "ETH",
//       toToken: "AAVE",
//       amount: 0.5,
//       unit: "ETH",
//       reason: "Rebalance portfolio",
//       timestamp: Date.now()
//     },
//     {
//       type: "stake",
//       fromToken: "USDC",
//       toToken: "AAVE",
//       amount: 100,
//       unit: "USDC",
//       reason: "Earn interest",
//       timestamp: Date.now()
//     },
//     {
//       type: "swap",
//       fromToken: "BTC",
//       toToken: "AAVE",
//       amount: 1,
//       unit: "BTC",
//       reason: "Invalid token test",
//       timestamp: Date.now()
//     },
//     {
//       type: undefined,
//       fromToken: "ETH",
//       toToken: "AAVE",
//       amount: 0.1,
//       unit: "ETH",
//       reason: "Missing type test",
//       timestamp: Date.now()
//     }
//   ];

//   for (const action of testActions) {
//     const result = await agent.authorizeAction(action, userSettings);
//     console.log("Action:", action);
//     console.log("Authorization result:", result);
//     console.log("────────────────────────────");
//   }
// })();
