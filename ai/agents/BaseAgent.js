import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

class Agent {
  constructor(name, systemPrompt, tools = []) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
      maxOutputTokens: 500,
    });
    this.memory = [];
  }

  async run(userInput) {
    const toolOutputs = [];
    for (const tool of this.tools) {
      const output = await tool._call(userInput);
      toolOutputs.push(`${tool.name}: ${output}`);
    }

    const messages = [
      new SystemMessage(this.systemPrompt),
      ...this.memory,
      new HumanMessage(
        `User input: ${userInput}\n\nTool outputs:\n${toolOutputs.join("\n")}`
      ),
    ];

    const response = await this.model.generate([messages]);
    const reply = response.generations[0][0].text;

    this.memory.push(new HumanMessage(userInput));
    this.memory.push(new AIMessage(reply));

    return reply;
  }
}

// --- 3. Example usage ---
// (async () => {
//   const agent = new Agent(
//     "Agent1",
//     "You are a helpful assistant that uses tools to answer questions.",
//     [new CustomTool()]
//   );

//   const output = await agent.run("Demonstrate the custom tool.");
//   console.log("Agent output:", output);
// })();
