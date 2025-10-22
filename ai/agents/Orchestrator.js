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
    maxSwapPercentage: 50, // max % of a token that can be swapped
    allowedTokens: ["ETH", "AAVE", "USDC"],
    allowedActions: ["swap", "stake", "unstake"],
    maxDailyTransactions: 5,
    dailySwapLimits: { ETH: 5, AAVE: 100, USDC: 1000 },
    portfolio, // include the user's current portfolio
  };

  let finalAction = null;
  let iteration = 0;
  const maxIterations = 3;

  // --- A2A loop ---
  while (iteration < maxIterations) {
    console.log(`\n--- Iteration ${iteration + 1} ---`);

    // Gather context from other agents
    const reputationData = await reputationAgent.assessReputation(userQuery);
    const newsData = await newsAgent.getNews(userQuery);
    const priceData = await priceAgent.getPrice(userQuery);

    console.log("📰 News:", newsData);
    console.log("📊 Reputation:", reputationData);
    console.log("💰 Prices:", priceData);
    console.log("💼 Portfolio:", portfolio);

    // Propose action dynamically
    const proposedAction = await decisionAgent.proposeDynamicAction(userQuery, {
      getReputation: async () => reputationData,
      getNews: async () => newsData,
      getPrices: async () => priceData,
      getPortfolio: async () => portfolio,
    }, 3);

    console.log("🤖 Decision Agent proposed:", proposedAction);

    // Validate action with AuthorizationAgent
    const authResult = await authAgent.authorizeAction(proposedAction, userSettings);
    console.log("✅ Authorization result:", authResult);

    if (authResult.authorized) {
      finalAction = proposedAction;
      break;
    } else {
      // If not authorized, instruct the DecisionAgent to adjust
      console.log(`⚠ Action not authorized: ${authResult.reason}`);
      userQuery = `Previous proposed action was rejected: ${authResult.reason}. Adjust the action while keeping user intent. Original query: ${userQuery}`;
    }

    iteration++;
  }

  if (!finalAction) {
    console.log("\n❌ Could not generate an authorized action within the iteration limit.");
    return null;
  }

  console.log("\n🎯 Final authorized action:", finalAction);
  return finalAction;
}

// --- Example usage ---
(async () => {
  const samplePortfolio = {
    ETH: 2.0,
    AAVE: 50,
    USDC: 1000
  };

  const userQuery = "Rebalance my portfolio to reduce ETH exposure and increase AAVE holdings.";

  const finalAction = await orchestrate(userQuery, samplePortfolio);
})();
