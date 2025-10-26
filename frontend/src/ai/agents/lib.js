import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function summarizeAgentResponse(agentResponse) {
    try {
  const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.5,
        maxOutputTokens: 25,
      });

      const messages = [
        new SystemMessage(
          "You are a summarization assistant. Take the following text from an agent and summarize it into a concise markdown format. Make one simple user-readable paragraph. DO NOT USE ANY MARKDOWN SYMBOLS, JUST PLAIN TEXT. IT SHOULD BE CONCISE, LESS THAN 50 WORDS."
        ),
        new HumanMessage(`The text to summarize is:
            ${agentResponse}`)
      ];

      // Use generate() instead of call()
      const response = await llm.generate([messages]);
    //   console.log("Summarization response:", response);
      return response.generations[0][0].text.trim();

    // const jsonText = completion.choices[0].message.content.trim();
    // return summary;
  } catch (err) {
    console.error("Error summarizing agent response:", err);
    return null;
  }
}

