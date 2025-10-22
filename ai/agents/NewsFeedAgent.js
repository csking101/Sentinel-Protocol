import { Agent } from "./BaseAgent.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import dotenv from "dotenv";

dotenv.config();

const newsFeedTool = new DynamicStructuredTool({
  name: "news_feed",
  description: `Fetch live news articles from NewsAPI given a coin, a topic and the number of articles.
  
    The available coins IDs are:
  - matic-network
  - aave
  - doge
  - usd-coin
  - ethereum

  The available topics are:
  - technology
  - business
  - sports
  - entertainment
  - health
  - science
  
  The number of articles can be between 1 and 10.
  `,
  schema: {
    type: "object",
    properties: {
      coin: {
        type: "string",
        description: "The coin ID, like 'aave' or 'ethereum'.",
      },
      topic: {
        type: "string",
        description: "The topic to fetch news about, like 'technology' or 'sports'.",
      },
      numberOfArticles: {
        type: "integer",
        description: "The number of articles to fetch, between 1 and 10.",
        minimum: 1,
        maximum: 10,
      },
    },
    required: ["coin", "topic", "numberOfArticles"],
  },
  func: async ({ coin, topic, numberOfArticles }) => {
    try {
      const apiKey = process.env.NEWS_API_KEY;
      const url = `https://newsapi.org/v2/everything?q=${coin}+${topic}&pageSize=${numberOfArticles}&apiKey=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "ok") {
        throw new Error(`NewsAPI error: ${data.message}`);
      }

      if (!data.articles || data.articles.length === 0) {
        return "No articles found.";
      }

      // ✅ Return a string (not raw JSON)
      return data.articles
        .slice(0, numberOfArticles)
        .map((a, i) => `${i + 1}. ${a.title} (${a.source.name})`)
        .join("\n");
    } catch (error) {
      return `Error: ${error.message}`;
    }
  },
});

export class NewsFeedAgent extends Agent {
  constructor(name = "NewsFeedAgent") {
    const newsFeedAgentSystemPrompt = `You are a news assistant. When asked about news articles, use the news_feed tool to fetch live news from NewsAPI. You will be provided with a coin ID, a topic, and the number of articles to get the news data.`;
    super(name, newsFeedAgentSystemPrompt, [newsFeedTool], true);
  }

  async getNews(query) {
    return this.run(query);
  }
}

// Example usage
// (async () => {
//   const agent = new NewsFeedAgent();
//   console.log(
//     await agent.getNews("What has aave been doing in the technology sector? Provide 3 articles.")
//   );
// })();
