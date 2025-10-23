// app/api/test/route.js
import { PriceFeedAgent } from "@/ai/agents/PriceFeedAgent";

export async function GET(req) {
    const agent = new PriceFeedAgent();
    const price = await agent.getPrice("AAVE");
    return new Response(JSON.stringify({ price }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}


// Optional POST
export async function POST(req) {
  const body = await req.json();
  return new Response(JSON.stringify({ received: body }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
