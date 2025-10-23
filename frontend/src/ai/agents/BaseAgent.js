import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";

export class Agent {
  constructor(name, systemPrompt, tools = [], debug = false) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.memory = [];
    this.debug = debug;

    // Convert LangChain tools → OpenAI-compatible format
    this.openAITools = this.tools.map(convertToOpenAITool);

    this.model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
    });
  }

  log(...args) {
    if (this.debug) console.log(`[${this.name}]`, ...args);
  }

  showHistory() {
    console.log(`\n🧩 Conversation History for ${this.name}:\n`);
    for (const msg of this.memory) {
      if (msg._getType() === "human") console.log(`👤 User: ${msg.content}`);
      else if (msg._getType() === "ai") console.log(`🤖 AI: ${msg.content}`);
      else if (msg._getType() === "tool")
        console.log(`🛠️ Tool (${msg.name}): ${msg.content}`);
      else if (msg._getType() === "system")
        console.log(`⚙️ System: ${msg.content}`);
    }
    console.log("\n────────────────────────────\n");
  }

  async run(userInput) {
    this.log("📝 Input received:", userInput);

    const messages = [
      new SystemMessage(this.systemPrompt),
      ...this.memory,
      new HumanMessage(userInput),
    ];

    const response = await this.model.invoke(messages, {
      tools: this.openAITools,
    });

    // If LLM requests tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolResults = [];

      for (const call of response.tool_calls) {
        const tool = this.tools.find((t) => t.name === call.name);
        if (!tool) continue;

        const args = call.args || {};
        this.log(`🧰 Tool call: ${call.name}(${JSON.stringify(args)})`);

        const output = await tool.invoke(args);
        this.log(`🔧 Tool output: ${output}`);

        toolResults.push(
          new ToolMessage({
            tool_call_id: call.id,
            name: call.name,
            content: output,
          })
        );
      }

      // Final model response after tool outputs
      const finalResponse = await this.model.invoke([
        ...messages,
        response,
        ...toolResults,
      ]);

      this.memory.push(new HumanMessage(userInput));
      this.memory.push(finalResponse);

      this.log("💬 Final reply:", finalResponse.content);
      if (this.debug) this.showHistory();

      return finalResponse.content;
    }

    // No tool call case
    this.memory.push(new HumanMessage(userInput));
    this.memory.push(response);

    this.log("💬 Response:", response.content);
    if (this.debug) this.showHistory();

    return response.content;
  }
}
