import { Agent } from "./BaseAgent.js";
import { Client, PrivateKey, Hbar, TransferTransaction, AccountId } from "@hashgraph/sdk";
import { HederaLangchainToolkit, coreAccountPlugin, coreTokenPlugin } from "hedera-agent-kit";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import dotenv from "dotenv";

dotenv.config();

/**
 * ExecutorAgent - Executes authorized actions on Hedera network
 * Supports two modes:
 * 1. AUTONOMOUS: Agent signs and executes transactions
 * 2. RETURN_BYTES: Returns transaction bytes for user to sign (HITL)
 */
export class ExecutorAgent extends Agent {
  constructor(name = "ExecutorAgent", mode = "AUTONOMOUS") {
    const systemPrompt = `
      You execute authorized financial actions on the Hedera network.
      You can transfer HBAR, transfer tokens, and manage token operations.
      Always validate balances before execution.
      Mode: ${mode}
    `;
    super(name, systemPrompt, [], true);
    
    this.mode = mode; // AUTONOMOUS or RETURN_BYTES
    this.client = null;
    this.hederaToolkit = null;
    this.agent = null;
  }

  /**
   * Initialize Hedera client and toolkit
   */
  async initialize() {
    try {
      console.log("\n🔧 Initializing ExecutorAgent...");
      
      // Setup Hedera client
      const network = process.env.HEDERA_NETWORK || "testnet";
      this.client = network === "mainnet" 
        ? Client.forMainnet() 
        : Client.forTestnet();
      
      this.client.setOperator(
        process.env.HEDERA_ACCOUNT_ID,
        PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY)
      );

      console.log(`✅ Connected to Hedera ${network}`);
      console.log(`📍 Operator: ${process.env.HEDERA_ACCOUNT_ID}`);

      // Initialize Hedera Agent Toolkit
      this.hederaToolkit = new HederaLangchainToolkit({
        client: this.client,
        configuration: {
          context: {
            mode: this.mode,
          },
          plugins: [coreAccountPlugin, coreTokenPlugin],
        },
      });

      // Setup LLM
      const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
      });

      // Get tools from toolkit
      const tools = this.hederaToolkit.getTools();
      console.log(`🔧 Loaded ${tools.length} Hedera tools`);

      // Store tools for direct use
      this.tools = tools;
      this.llm = llm;

      console.log("✅ ExecutorAgent initialized successfully\n");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize ExecutorAgent:", error.message);
      throw error;
    }
  }

  /**
   * Execute an HBAR transfer
   */
  async transferHBAR(toAccountId, amount, memo = "") {
    console.log(`\n💸 Transferring ${amount} HBAR to ${toAccountId}...`);
    
    try {
      if (this.mode === "AUTONOMOUS") {
        // Execute directly
        const transaction = await new TransferTransaction()
          .addHbarTransfer(this.client.operatorAccountId, new Hbar(-amount))
          .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amount))
          .setTransactionMemo(memo)
          .execute(this.client);

        const receipt = await transaction.getReceipt(this.client);
        
        return {
          success: true,
          mode: "autonomous",
          transactionId: transaction.transactionId.toString(),
          status: receipt.status.toString(),
          details: {
            type: "transfer",
            from: this.client.operatorAccountId.toString(),
            to: toAccountId,
            amount: amount,
            currency: "HBAR",
            memo: memo,
            timestamp: Date.now(),
          },
        };
      } else {
        // RETURN_BYTES mode - return transaction bytes for user to sign
        const transaction = await new TransferTransaction()
          .addHbarTransfer(this.client.operatorAccountId, new Hbar(-amount))
          .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amount))
          .setTransactionMemo(memo)
          .freezeWith(this.client);

        const transactionBytes = transaction.toBytes();
        
        return {
          success: true,
          mode: "return_bytes",
          transactionBytes: Buffer.from(transactionBytes).toString("base64"),
          details: {
            type: "transfer",
            from: this.client.operatorAccountId.toString(),
            to: toAccountId,
            amount: amount,
            currency: "HBAR",
            memo: memo,
          },
          message: "Transaction prepared. User must sign and submit.",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Transfer failed: ${error.message}`,
      };
    }
  }

  /**
   * Execute action using natural language with Hedera tools
   */
  async executeWithNaturalLanguage(query, chatHistory = []) {
    if (!this.llm || !this.tools) {
      throw new Error("ExecutorAgent not initialized. Call initialize() first.");
    }

    console.log(`\n🤖 Processing: "${query}"`);
    
    try {
      // Use LLM to determine which tool to call
      const prompt = `Based on this request: "${query}", determine the appropriate action and parameters.
Available tools: ${this.tools.map(t => t.name).join(", ")}

Respond with a JSON object containing:
{
  "tool": "tool_name",
  "parameters": {...}
}`;

      const response = await this.llm.invoke(prompt);
      
      return {
        success: true,
        output: response.content,
        mode: this.mode,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute a proposed action from DecisionAgent
   */
  async executeAction(action, portfolio) {
    if (!this.agent) {
      throw new Error("ExecutorAgent not initialized. Call initialize() first.");
    }

    const actualAction = action.action || action;
    const { type, fromToken, toToken, amount, reason } = actualAction;

    console.log(`\n🚀 Executing ${type} action...`);
    console.log(`   From: ${fromToken} | To: ${toToken} | Amount: ${amount}`);
    console.log(`   Reason: ${reason}`);

    try {
      // Validate balance
      if (type === "swap" || type === "transfer") {
        const availableBalance = portfolio[fromToken] || 0;
        if (availableBalance < amount) {
          return {
            success: false,
            error: `Insufficient balance. Available: ${availableBalance} ${fromToken}, Required: ${amount}`,
          };
        }
      }

      // Build natural language query for Hedera Agent Kit
      let query = "";
      
      if (type === "swap" || type === "transfer") {
        // For demo purposes, convert token swap to HBAR transfer
        // In production, you'd integrate with a DEX or use HTS
        if (fromToken === "HBAR") {
          query = `Transfer ${amount} HBAR to account ${toToken} with memo "${reason}"`;
        } else {
          query = `Transfer ${amount} of token ${fromToken} to account ${toToken}`;
        }
      } else if (type === "stake") {
        query = `Stake ${amount} ${fromToken} with memo "${reason}"`;
      } else if (type === "unstake") {
        query = `Unstake ${amount} ${fromToken} with memo "${reason}"`;
      }

      // Execute using Hedera Agent Kit
      const result = await this.executeWithNaturalLanguage(query);

      return {
        success: result.success,
        mode: this.mode,
        output: result.output,
        action: actualAction,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Execution failed: ${error.message}`,
      };
    }
  }

  /**
   * Simulate an action without executing
   */
  async simulate(action, portfolio) {
    const actualAction = action.action || action;
    const { type, fromToken, toToken, amount } = actualAction;

    console.log(`\n🧪 Simulating ${type} action...`);

    // Mock exchange rates
    const exchangeRates = {
      HBAR_USDC: 0.05,
      USDC_HBAR: 20,
    };

    const rate = exchangeRates[`${fromToken}_${toToken}`] || 1;
    const estimatedReceive = amount * rate;

    return {
      success: true,
      mode: "simulation",
      details: {
        type,
        from: { token: fromToken, amount },
        to: { token: toToken, estimatedAmount: estimatedReceive },
        exchangeRate: rate,
        estimatedFee: 0.01,
        timestamp: Date.now(),
      },
      message: `Simulation: ${amount} ${fromToken} → ~${estimatedReceive.toFixed(4)} ${toToken}`,
    };
  }

  /**
   * Close the Hedera client
   */
  async close() {
    if (this.client) {
      this.client.close();
      console.log("🔌 Hedera client closed");
    }
  }
}

// --- Example Usage ---
(async () => {
  console.log("═".repeat(100));
  console.log("HEDERA EXECUTOR AGENT DEMO");
  console.log("═".repeat(100));

  try {
    // Initialize in AUTONOMOUS mode
    const executor = new ExecutorAgent("HederaExecutor", "AUTONOMOUS");
    await executor.initialize();

    // Example 1: Direct HBAR transfer
    console.log("\n" + "─".repeat(80));
    console.log("TEST 1: Direct HBAR Transfer");
    console.log("─".repeat(80));
    
    const transferResult = await executor.transferHBAR(
      "0.0.123456", // Replace with actual account ID
      1.0,
      "Test transfer from ExecutorAgent"
    );
    console.log("\n📊 Result:", transferResult);

    // Example 2: Natural language execution
    console.log("\n" + "─".repeat(80));
    console.log("TEST 2: Natural Language Execution");
    console.log("─".repeat(80));
    
    const nlResult = await executor.executeWithNaturalLanguage(
      "Transfer 0.5 HBAR to account 0.0.123456 with memo 'AI agent transfer'"
    );
    console.log("\n📊 Result:", nlResult);

    // Example 3: Execute proposed action
    console.log("\n" + "─".repeat(80));
    console.log("TEST 3: Execute Proposed Action");
    console.log("─".repeat(80));
    
    const proposedAction = {
      type: "transfer",
      fromToken: "HBAR",
      toToken: "0.0.123456",
      amount: 2.0,
      unit: "HBAR",
      reason: "Portfolio rebalancing",
      timestamp: Date.now(),
    };

    const portfolio = { HBAR: 10, USDC: 1000 };
    const actionResult = await executor.executeAction(proposedAction, portfolio);
    console.log("\n📊 Result:", actionResult);

    // Close client
    await executor.close();

  } catch (error) {
    console.error("\n❌ Demo failed:", error.message);
  }

  console.log("\n" + "═".repeat(100));
})();