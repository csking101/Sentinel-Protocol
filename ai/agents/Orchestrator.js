import { ReputationDecisionAgent } from "./ReputationFeedAgent.js";
import { NewsFeedAgent } from "./NewsFeedAgent.js";
import { PriceFeedAgent } from "./PriceFeedAgent.js";
import { DecisionAgent } from "./DecisionAgent.js";
import { AuthorizationAgent } from "./AuthorizationAgent.js";

/**
 * Sample portfolio structure:
 * {
 *   ETH: 2.0,
 *   AAVE: 50,
 *   USDC: 1000
 * }
 */
async function orchestrate(userQuery, portfolio) {
  // --- Instantiate all agents ---
  const reputationAgent = new ReputationDecisionAgent();
  const newsAgent = new NewsFeedAgent();
  const priceAgent = new PriceFeedAgent();
  const decisionAgent = new DecisionAgent();
  const authAgent = new AuthorizationAgent();

  // --- Example user settings ---
  const userSettings = {
    maxSwapPercentage: 50,
    allowedTokens: ["ETH", "AAVE", "USDC"],
    allowedActions: ["swap", "stake", "unstake"],
    maxDailyTransactions: 5,
    dailySwapLimits: { ETH: 5, AAVE: 100, USDC: 1000 },
    portfolio,
  };

  console.log(`\n🎯 Starting orchestration for query: "${userQuery}"`);
  console.log("💼 Current Portfolio:", portfolio);

  const maxAttempts = 2; // Maximum authorization attempts
  let attempt = 0;
  let currentQuery = userQuery;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📍 Attempt ${attempt}/${maxAttempts}`);
    console.log(`${"=".repeat(80)}`);

    // Step 1: DecisionAgent proposes action with A2A communication
    // It can query up to 3 other agents autonomously
    console.log("\n🤖 DecisionAgent consulting other agents (max 3 queries)...");
    
    const proposedAction = await decisionAgent.proposeDynamicAction(
      currentQuery,
      {
        getReputation: async (query) => {
          console.log("  📊 DecisionAgent → ReputationAgent");
          return await reputationAgent.assessReputation(query || currentQuery);
        },
        getNews: async (query) => {
          console.log("  📰 DecisionAgent → NewsAgent");
          return await newsAgent.getNews(query || currentQuery);
        },
        getPrices: async (query) => {
          console.log("  💰 DecisionAgent → PriceAgent");
          return await priceAgent.getPrice(query || currentQuery);
        },
        getPortfolio: async () => {
          console.log("  💼 DecisionAgent → Portfolio");
          return portfolio;
        },
      },
      3 // Max 3 A2A queries
    );

    console.log("\n✨ DecisionAgent proposed action:", proposedAction);

    // Step 2: Every proposed action goes through AuthorizationAgent
    console.log("\n🔐 Sending to AuthorizationAgent for validation...");
    const authResult = await authAgent.authorizeAction(proposedAction, userSettings);
    console.log("📋 Authorization result:", authResult);

    if (authResult.authorized) {
      // Success! Action is authorized
      console.log("\n✅ Action AUTHORIZED!");
      console.log("\n🎯 Final authorized action:", proposedAction);
      return proposedAction;
    } else {
      // Action rejected, provide feedback to DecisionAgent
      console.log(`\n❌ Action REJECTED: ${authResult.reason}`);
      
      if (attempt < maxAttempts) {
        console.log("\n🔄 Providing feedback to DecisionAgent for adjustment...");
        // Update query with rejection feedback for next iteration
        currentQuery = `
Previous action was rejected by AuthorizationAgent.
Rejection reason: ${authResult.reason}

User settings for reference:
- Max swap percentage: ${userSettings.maxSwapPercentage}%
- Allowed tokens: ${userSettings.allowedTokens.join(", ")}
- Allowed actions: ${userSettings.allowedActions.join(", ")}
- Current portfolio: ${JSON.stringify(portfolio)}

Original user request: ${userQuery}

Please propose a new action that addresses the rejection reason while fulfilling the user's intent.
        `.trim();
      }
    }
  }

  // Failed to get authorized action after max attempts
  console.log("\n❌ Could not generate an authorized action within the attempt limit.");
  return {};
}

// --- Example usage ---
// (async () => {
//   const samplePortfolio = {
//     ETH: 2.0,
//     AAVE: 50,
//     USDC: 1000
//   };

//   // Test with different scenarios
//   const testCases = [
//     {
//       query: "Rebalance my portfolio to reduce ETH exposure and increase AAVE holdings.",
//       portfolio: samplePortfolio
//     },
//     {
//       query: "Swap all my ETH to AAVE", // Should fail due to max percentage
//       portfolio: samplePortfolio
//     },
//     {
//       query: "Swap 0.5 ETH to AAVE based on current market conditions",
//       portfolio: samplePortfolio
//     }
//   ];

//   for (const testCase of testCases) {
//     console.log("\n\n" + "█".repeat(100));
//     console.log(`TEST CASE: ${testCase.query}`);
//     console.log("█".repeat(100));
    
//     const result = await orchestrate(testCase.query, testCase.portfolio);
    
//     if (result) {
//       console.log("\n✅ TEST PASSED - Action authorized and returned");
//     } else {
//       console.log("\n❌ TEST FAILED - No authorized action found");
//     }
    
//     console.log("\n" + "█".repeat(100));
//   }
// })();