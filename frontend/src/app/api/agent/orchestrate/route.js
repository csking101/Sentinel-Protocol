/*
Let the trigger have a reason or a description. The two types can be a regular periodic trigger or due a  an external event (like a price drop).
On trigger, the flow will be:
1. Price Feed Agent fetches latest prices.
2. News Agent fetches recent news.
3. Reputation Agent fetches reputation data.
4. Decision Agent proposes action based on aggregated data.
5. The decision agent sends this proposed action to the authorization agent.
6. If authorized, the action is executed; Otherwise, the decision is revised. The Decision agent can talk to any other of the agents in the meanwhile to gather more information if needed. Finally, it will send the revised action to the authorization agent again. It can revise its action up to 2 times.
7. Once authorized, the proposed action is executed, by the execution agent. It performs a swap (Satpathy's API).
*/

// app/api/orchestrate/route.js
import { PriceFeedAgent } from "@/ai/agents/PriceFeedAgent.js";
import { NewsFeedAgent } from "@/ai/agents/NewsFeedAgent.js";
import { ReputationDecisionAgent } from "@/ai/agents/ReputationFeedAgent.js";
import { DecisionAgent } from "@/ai/agents/DecisionAgent.js";
import { AuthorizationAgent } from "@/ai/agents/AuthorizationAgent";
// import { ExecutiorAgent } from "@/ai/agents/ExecutionAgent.js";

/**
 * This endpoint orchestrates multiple agents in sequence.
 * POST /api/orchestrator
 */
export async function POST(request) {
  try {
    console.log("Orchestrator invoked");
    
    const body = await request.json();
    console.log("Received body:", body);

    const triggerReason = body.triggerReason || "Scheduled trigger";

    console.log("Orchestrator triggered due to:", triggerReason);
    console.log(await new DecisionAgent().chooseRequiredFeed(triggerReason));

    const priceAgent = new PriceFeedAgent();
    const newsAgent = new NewsFeedAgent();
    const reputationAgent = new ReputationDecisionAgent();
    const decisionAgent = new DecisionAgent();
    const authAgent = new AuthorizationAgent();

    let revisionCount = 0;
    let authorized = false;
    let callAgents = {
        priceFeed: true,
        newsFeed: true,
        reputationFeed: true
    }
    let context = {};

    let priceAgentResponse = "";
    let newsAgentResponse = "";
    let reputationAgentResponse = "";
    //Keep a track of the memory as well as a message array

    while (!authorized && revisionCount <= 2) {
        console.log(`--- Orchestration Iteration ${revisionCount + 1} ---`);

        if (callAgents.priceFeed) {
            priceAgentResponse = await priceAgent.getResponse(triggerReason);
            console.log("Price Agent Response:", priceAgentResponse);
        }
    
        if (callAgents.newsFeed) {
            newsAgentResponse = await newsAgent.getNews(triggerReason);
            console.log("News Agent Response:", newsAgentResponse);
        }
    
        if (callAgents.reputationFeed) {
            reputationAgentResponse = await reputationAgent.assessReputation(triggerReason);
            console.log("Reputation Agent Response:", reputationAgentResponse);
        }

        context = {
            ...context,
            triggerReason,
            prices: priceAgentResponse || "",
            news: newsAgentResponse || "",
            reputation: reputationAgentResponse || "",
        };
        
        const portfolio = body.portfolio ;

        const proposedAction = await decisionAgent.proposeAction(context,portfolio);

        console.log("Proposed Action:", proposedAction);

        //This is hard coded and add the user portfolio context as well and proper user settings input
        const userSettings = {
            maxSwapPercentage: 50,
            allowedTokens: ["ETH", "AAVE", "USDC"],
            allowedActions: ["swap", "stake", "unstake"],
        };

        authorized = await authAgent.authorizeAction(proposedAction,userSettings);
        
        if (!authorized) {
            console.log(`Action not authorized. Preparing for revision...`);
            revisionCount++;

            // Determine which agents to call in the next iteration based on decision agent feedback
            const feedDecision = await decisionAgent.chooseRequiredFeed(context);
            callAgents = {
                priceFeed: feedDecision.priceFeed,
                newsFeed: feedDecision.newsFeed,
                reputationFeed: feedDecision.reputationFeed
            };
        } else {
            console.log("Action authorized.");
            //Execute action
            return Response.json(proposedAction);
        }

    }
        console.log("Maximum revisions reached. Action not authorized.");
        return Response.json(
          { success: false, error: "Action not authorized after maximum revisions." },
          { status: 403 }
        );
    
  } catch (error) {
    console.error("Error in orchestrator:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
