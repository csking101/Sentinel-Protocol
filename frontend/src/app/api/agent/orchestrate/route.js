import { PriceFeedAgent } from "@/ai/agents/PriceFeedAgent.js";
import { NewsFeedAgent } from "@/ai/agents/NewsFeedAgent.js";
import { ReputationDecisionAgent } from "@/ai/agents/ReputationFeedAgent.js";
import { DecisionAgent } from "@/ai/agents/DecisionAgent.js";
import { AuthorizationAgent } from "@/ai/agents/AuthorizationAgent.js";
import { summarizeAgentResponse } from "@/ai/agents/lib.js";

// Simple helper for async delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatProposedActionMessage(action) {
  if (!action) return "No action proposed.";

  const time = new Date(action.timestamp).toLocaleString();

  let actionStr = "";

  switch (action.action) {
    case "swap":
      actionStr = `Swap from ${action.fromToken} to ${action.toToken} of amount ${action.amount} ${action.fromToken}, with reason - ${action.reason}`;
      break;

    case "stake":
      actionStr = `📈 **Stake**
Token: ${action.toToken}
Amount: ${action.amount} ${action.unit}
Reason: ${action.reason}
Time: ${time}`;
      break;

    case "unstake":
      actionStr = `📉 **Unstake**
From: ${action.fromToken}
Amount: ${action.amount} ${action.unit}
Reason: ${action.reason}
Time: ${time}`;
      break;

    default:
      actionStr = `⚠️ Unknown action type: ${JSON.stringify(action)}`;
  }

  return actionStr;
}

/**
 * Server-Sent Events orchestrator
 * Streams live updates as agents run
 */
export async function POST(request) {
  try {
    // Parse JSON body safely
    const bodyText = await request.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const triggerReason = body.triggerReason || "Scheduled trigger";
    const portfolio = body.portfolio || {};

    // Set up the stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Helper to send messages to the client
        const send = (obj) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        send({ type: "status", message: "🧠 Orchestrator started..." });
        await delay(1000);

        send({ type: "info", message: `Trigger reason: ${triggerReason}` });
        await delay(1000);

        const formattedPortfolio = Object.entries(portfolio)
          .map(([token, amount]) => `${token}: ${amount}`)
          .join(", "); // or "\n" if you want each on a new line
        send({ type: "info", message: `Analyzing portfolio: ${formattedPortfolio}` });
        await delay(1500);

        const priceAgent = new PriceFeedAgent();
        const newsAgent = new NewsFeedAgent();
        const reputationAgent = new ReputationDecisionAgent();
        const decisionAgent = new DecisionAgent();
        const authAgent = new AuthorizationAgent();

        let revisionCount = 0;
        let authorized = false;
        let callAgents = { priceFeed: true, newsFeed: true, reputationFeed: true };
        let context = {};

        let priceAgentResponse = "";
        let newsAgentResponse = "";
        let reputationAgentResponse = "";

        while (!authorized && revisionCount <= 2) {
          send({ type: "loop", message: `🔁 Iteration ${revisionCount + 1}` });
          await delay(1000);

          if (callAgents.priceFeed) {
            priceAgentResponse = await priceAgent.getResponse(triggerReason);
            // const summarizedPriceResponse = await summarizeAgentResponse(priceAgentResponse);
            // priceAgentResponse = summarizedPriceResponse || priceAgentResponse;
            send({ type: "agent", name: "Price Feed Agent", message: priceAgentResponse });
          }

          if (callAgents.newsFeed) {
            newsAgentResponse = await newsAgent.getNews(triggerReason);
            const summarizedNewsResponse = await summarizeAgentResponse(newsAgentResponse);
            newsAgentResponse = summarizedNewsResponse || newsAgentResponse;
            send({ type: "agent", name: "News Feed Agent", message: newsAgentResponse });
          }

          if (callAgents.reputationFeed) {
            reputationAgentResponse = await reputationAgent.assessReputation(triggerReason);
            const summarizedReputationResponse = await summarizeAgentResponse(reputationAgentResponse);
            reputationAgentResponse = summarizedReputationResponse || reputationAgentResponse;
            send({ type: "agent", name: "Reputation Agent", message: reputationAgentResponse });
          }

          context = {
            ...context,
            triggerReason,
            prices: priceAgentResponse || "",
            news: newsAgentResponse || "",
            reputation: reputationAgentResponse || "",
          };

          const proposedAction = await decisionAgent.proposeAction(context, portfolio);
          send({
  type: "decision",
  message: formatProposedActionMessage(proposedAction),
});

          const userSettings = {
            maxSwapPercentage: 50,
            allowedTokens: ["ETH", "AAVE", "USDC"],
            allowedActions: ["swap", "stake", "unstake"],
          };

          authorized = await authAgent.authorizeAction(proposedAction, userSettings);

          if (!authorized) {
            revisionCount++;
            send({ type: "auth", message: "Action not authorized, revising..." });
            const feedDecision = await decisionAgent.chooseRequiredFeed(context);
            callAgents = feedDecision;
          } else {
            send({ type: "auth", message: "✅ Action authorized!" });
            send({ type: "action", message: "Executing action...", data: proposedAction });
          }

          await delay(1000);
        }

        if (!authorized) {
          send({
            type: "error",
            message: "Action not authorized after maximum revisions.",
          });
        }

        send({ type: "status", message: "✅ Orchestration complete." });
        controller.close();
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Error in orchestrator:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
