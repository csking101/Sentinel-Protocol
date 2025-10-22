import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";

export class Agent {
  constructor(name, systemPrompt, tools = []) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.memory = [];

    this.openAITools = this.tools.map(convertToOpenAITool);

    this.model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
    });
  }

  async run(userInput) {
    const messages = [
      new SystemMessage(this.systemPrompt),
      ...this.memory,
      new HumanMessage(userInput),
    ];

    const response = await this.model.invoke(messages, {
      tools: this.openAITools,
    });

    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolResults = [];

      for (const call of response.tool_calls) {
        const tool = this.tools.find((t) => t.name === call.name);
        if (!tool) continue;

        const args = call.args || {};
        const output = await tool.invoke(args);

        // ✅ create ToolMessage with tool_call_id
        toolResults.push(
          new ToolMessage({
            tool_call_id: call.id,
            name: call.name,
            content: output,
          })
        );
      }

      // LLM finalizes after seeing the tool results
      const finalResponse = await this.model.invoke([
        ...messages,
        response,
        ...toolResults,
      ]);

      this.memory.push(new HumanMessage(userInput));
      this.memory.push(finalResponse);

      return finalResponse.content;
    }

    // No tools called
    this.memory.push(new HumanMessage(userInput));
    this.memory.push(response);

    return response.content;
  }
}
