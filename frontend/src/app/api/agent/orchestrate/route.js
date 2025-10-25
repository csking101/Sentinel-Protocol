import { PriceFeedAgent } from "@/ai/agents/PriceFeedAgent.js";
import { NewsFeedAgent } from "@/ai/agents/NewsFeedAgent.js";
import { ReputationDecisionAgent } from "@/ai/agents/ReputationFeedAgent.js";
import { DecisionAgent } from "@/ai/agents/DecisionAgent.js";
import { AuthorizationAgent } from "@/ai/agents/AuthorizationAgent.js";

// Simple helper for async delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

        send({ type: "info", message: `Analyzing portfolio: ${JSON.stringify(portfolio)}` });
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
            send({ type: "agent", name: "PriceFeedAgent", message: priceAgentResponse });
          }

          if (callAgents.newsFeed) {
            newsAgentResponse = await newsAgent.getNews(triggerReason);
            send({ type: "agent", name: "NewsFeedAgent", message: newsAgentResponse });
          }

          if (callAgents.reputationFeed) {
            reputationAgentResponse = await reputationAgent.assessReputation(triggerReason);
            send({ type: "agent", name: "ReputationAgent", message: reputationAgentResponse });
          }

          context = {
            ...context,
            triggerReason,
            prices: priceAgentResponse || "",
            news: newsAgentResponse || "",
            reputation: reputationAgentResponse || "",
          };

          const proposedAction = await decisionAgent.proposeAction(context, portfolio);
          send({ type: "decision", message: "Proposed Action", data: proposedAction });

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
