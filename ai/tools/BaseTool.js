import { Tool } from "@langchain/core/tools";

class CustomTool extends Tool {
  name = "custom_tool";
  description = "A simple demo tool";
  async _call(input) {
    return `You called the tool with: "${input}"`;
  }
}