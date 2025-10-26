/**
 * Sentinel Protocol — Agent Orchestrator (A2A Compliant)
 * --------------------------------------------------------
 * This module coordinates multiple AI agents under the A2A standard.
 * Agents communicate through structured message envelopes with
 * metadata, context, and trace identifiers for observability.
 *
 * Agents:
 *  - ReputationDecisionAgent
 *  - NewsFeedAgent
 *  - PriceFeedAgent
 *  - DecisionAgent
 *  - AuthorizationAgent
 *
 * Sponsors:
 *  🟢 Hedera (A2A & validation layer)
 *  🟣 Pyth (price & entropy feed)
 *  🔵 Lit (authorization via Vincent)
 */

import { ReputationDecisionAgent } from "./ReputationFeedAgent.js";
import { NewsFeedAgent } from "./NewsFeedAgent.js";
import { PriceFeedAgent } from "./PriceFeedAgent.js";
import { DecisionAgent } from "./DecisionAgent.js";
import { AuthorizationAgent } from "./AuthorizationAgent.js";

/**
 * Standard A2A Message Format
 */
function createAgentMessage({ sender, receiver, intent, data, context = {} }) {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sender,
    receiver,
    intent,
    data,
    context,
    trace: {
      correlationId: crypto.randomUUID(),
      parentSpan: context?.traceId || null,
    },
  };
}

/**
 * Logs formatted A2A interactions for better traceability.
 */
function logA2A(message) {
  console.log(
    `\n📡 [A2A] ${message.sender} → ${message.receiver}\n🪶 Intent: ${message.intent}\n📦 Payload:`,
    message.data
  );
}

/**
 * Orchestrates inter-agent communication under A2A protocol
 */
export async function orchestrate(userQuery, portfolio) {
  // Instantiate all agents
  const reputationAgent = new ReputationDecisionAgent();
  const newsAgent = new NewsFeedAgent();
  const priceAgent = new PriceFeedAgent();
  const decisionAgent = new DecisionAgent();
  const authAgent = new AuthorizationAgent();

  // User-defined constraints
  const userSettings = {
    maxSwapPercentage: 50,
    allowedTokens: ["ETH", "AAVE", "USDC"],
    allowedActions: ["swap", "stake", "unstake"],
    maxDailyTransactions: 5,
    dailySwapLimits: { ETH: 5, AAVE: 100, USDC: 1000 },
    portfolio,
  };

  console.log(`\n🎯 Initiating Sentinel A2A Orchestration for: "${userQuery}"`);
  console.log("💼 Current Portfolio:", portfolio);

  const maxAttempts = 2;
  let attempt = 0;
  let currentQuery = userQuery;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`\n${"=".repeat(90)}\n📍 Attempt ${attempt}/${maxAttempts}\n${"=".repeat(90)}`);

    // --- Step 1: Decision Agent initiates A2A communication ---
    console.log("\n🤖 DecisionAgent consulting peers via A2A...");

    const proposedAction = await decisionAgent.proposeDynamicAction(
      currentQuery,
      {
        getReputation: async (query) => {
          const msg = createAgentMessage({
            sender: "DecisionAgent",
            receiver: "ReputationAgent",
            intent: "assess_reputation",
            data: { query: query || currentQuery },
          });
          logA2A(msg);
          return await reputationAgent.assessReputation(msg.data.query);
        },
        getNews: async (query) => {
          const msg = createAgentMessage({
            sender: "DecisionAgent",
            receiver: "NewsAgent",
            intent: "fetch_news",
            data: { query: query || currentQuery },
          });
          logA2A(msg);
          return await newsAgent.getNews(msg.data.query);
        },
        getPrices: async (query) => {
          const msg = createAgentMessage({
            sender: "DecisionAgent",
            receiver: "PriceAgent",
            intent: "fetch_prices",
            data: { query: query || currentQuery },
          });
          logA2A(msg);
          return await priceAgent.getPrice(msg.data.query);
        },
        getPortfolio: async () => portfolio,
      },
      3 // max A2A hops
    );

    console.log("\n✨ Proposed Action from DecisionAgent:", proposedAction);

    // --- Step 2: Authorization phase ---
    const authMsg = createAgentMessage({
      sender: "DecisionAgent",
      receiver: "AuthorizationAgent",
      intent: "authorize_action",
      data: { proposedAction, userSettings },
    });
    logA2A(authMsg);

    const authResult = await authAgent.authorizeAction(proposedAction, userSettings);
    console.log("📋 Authorization result:", authResult);

    // --- Step 3: Outcome Handling ---
    if (authResult.authorized) {
      console.log("\n✅ Action AUTHORIZED & VERIFIED by AuthorizationAgent (Lit/Vincent).");
      return proposedAction;
    }

    console.log(`\n❌ Action REJECTED: ${authResult.reason}`);
    if (attempt < maxAttempts) {
      console.log("🔄 Feedback sent to DecisionAgent for revision...\n");
      currentQuery = `
Previous proposal rejected due to: ${authResult.reason}

User settings:
- Max swap percentage: ${userSettings.maxSwapPercentage}%
- Allowed actions: ${userSettings.allowedActions.join(", ")}
- Portfolio: ${JSON.stringify(portfolio)}

Original query: ${userQuery}

Please propose a compliant, revised action.
      `.trim();
    }
  }

  console.log("\n🚫 No authorized action generated within max attempts.");
  return {};
}

/**
 * Example usage
 */
// (async () => {
//   const portfolio = { ETH: 2.0, AAVE: 50, USDC: 1000 };
//   const query = "Rebalance my portfolio to reduce ETH and increase AAVE exposure.";
//   const result = await orchestrate(query, portfolio);
//   console.log("\nFinal result:", result);
// })();
