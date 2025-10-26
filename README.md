# 🛡️ Sentinel Protocol

**AI-Powered Web3 Reputation Protocol for Intelligent Portfolio Protection**

Built with **Hedera**, **Pyth Network**, and **Lit Protocol (Vincent)**  

---

## 📘 Overview

**Sentinel Protocol** is an intelligent AI-powered crypto wallet protector that prevents your tokens from losing value by intelligently executing swaps. It continuously analyzes news, market data, and on-chain reputation to safeguard your idle assets.

The system constantly monitors token credibility, detects market anomalies, and autonomously executes user-approved actions on your wallet — ensuring the safety of your funds during sudden market fluctuations.

🔗 **GitHub:** [https://github.com/csking101/Sentinel-Protocol](https://github.com/csking101/Sentinel-Protocol)

---

## 🚀 Core Idea

Sentinel Protocol introduces a **reputation-driven safeguard layer** for crypto portfolios.  
By combining **AI agents**, **on-chain data**, and **user-controlled execution**, it ensures **non-custodial, transparent, and intelligent portfolio management**.

At its core lies a network of **autonomous agents**:
- **Price Feed Agent** — Fetches real-time prices from **Coingecko** and on-chain **Pyth** feeds  
- **News Feed Agent** — Gathers market sentiment and coin-related headlines  
- **Reputation Agent** — Pulls token credibility from on-chain contracts on Hedera  
- **Decision Agent** — Aggregates all inputs and proposes optimal actions  
- **Authorization Agent** — Validates and approves actions before execution  
- **Execution Agent (Vincent)** — Executes approved swaps via **Lit Protocol**

This system creates a **trust-minimized, intelligent, and self-evolving orchestration** between AI, blockchain data, and decentralized execution.

---

## 💡 Overall Architecture Diagram

<img width="4058" height="3446" alt="Sentinel Protocol Architecture Diagram" src="https://github.com/user-attachments/assets/20a230f3-3487-455d-94f1-19dd37ecbd44" />

Vincent App: Sentinel Protocol, APP ID: 8047866111

Vincent Ability: Swap Tokens on Hedera Testnet

Vincent Ability NPM: @sentinel-protocol/swap-tokens-hedera-testnet - https://www.npmjs.com/package/@sentinel-protocol/swap-tokens-hedera-testnet

Pyth Integration: https://github.com/pyth-network/pyth-examples/pull/71

Reputation Layer: 
The Reputation Layer dynamically tracks and updates a token’s reputation score, reflecting its fundamental strength and risk profile. The score is based on factors like volatility, market stability, market cap, developer engangement and ecosystem strength . It evolves with changing market conditions but remains relatively stable against short-term fluctuations. The system aims to maximize asset value while staying token-agnostic—any token can be managed as long as its reputation score can be computed.

Once the agent finalises on executing a swap, it is executed on via a Vincent Ability on behalf of the user. Lit Protocol takes care of signing the transaction after a delegated address executes the ability. 


## AI Agent Orchestration Diagram

![Sentinel Protocol Agent](https://github.com/user-attachments/assets/8b47d93a-0b57-44ba-911c-87e17faf191d)

The orchestration follows this flow:
1. A trigger (periodic or market-based) hits the Next.js backend endpoint `/api/agent/orchestrate`.
2. The orchestrator invokes the **Price**, **News**, and **Reputation Agents** to collect real-time context.
3. The **Decision Agent** processes all insights to generate a proposed action.
4. The **Authorization Agent** validates the proposal based on user-defined constraints.
5. If approved, the **Executor Agent** (via **Vincent**) executes the swap or staking action.
6. If rejected, the decision is revised up to two iterations.

Each agent communicates using **Hedera Agent Kit’s A2A (Agent-to-Agent)** framework (based on the Google A2A standard), enabling decentralized orchestration and auditability.

---

## 🧠 AI + Web3 Integration

| Component | Description |
|------------|-------------|
| **Hedera** | Enables decentralized agent communication and on-chain reputation computation |
| **Pyth Network** | Provides real-time, verifiable price feeds and entropy-based randomness for stochastic modeling |
| **Lit Protocol / Vincent** | Manages user authorization and secure, delegated action execution |
| **Next.js Backend** | Hosts the orchestrator API for triggering and streaming real-time agent updates |
| **OpenAI / LangChain** | Used to summarize agent responses and enhance decision interpretability |

---

## ✨ Key Features

### 1. **Real-Time Price Integration**
- Fetches **live crypto prices** from **Pyth Network**
- Performs **price staleness checks** and **confidence interval analysis**
- Supports multi-token portfolios (BTC, ETH, SOL, MATIC, AAVE, DOGE, USDC)

### 2. **Reputation Scoring Engine**
- Evaluates **Market Stability**, **Fundamental Strength**, and **Risk Exposure**
- Aggregates into a **composite on-chain reputation score**
- Publishes reputation updates periodically to the Hedera sidechain

### 3. **Entropy-Powered Randomness**
- Leverages **Pyth Entropy** for verifiable randomness
- Introduces **stochastic variance** in reputation computation
- Reduces manipulation by making score generation unpredictable yet deterministic

### 4. **Agent-to-Agent (A2A) Communication**
- Fully modular and decentralized AI agents
- Agents collaborate, revise, and validate decisions through Hedera A2A
- Enables **multi-agent negotiation and consensus**

### 5. **Secure Delegated Execution**
- Uses **Lit Protocol (Vincent)** for cryptographically secure authorization
- Executes trades or staking actions **only after explicit user policy validation**
- Maintains a **non-custodial model** — users retain asset control


---

## 🧩 Tech Stack

| Layer | Tools / Frameworks |
|-------|--------------------|
| **Frontend** | Next.js (React, Framer Motion, Tailwind) |
| **Backend** | Next.js API Routes, Server-Sent Events (SSE) |
| **AI Agents** | LangChain, OpenAI |
| **Blockchain** | Hedera, Pyth Network, Lit Protocol |
| **Data Sources** | Coingecko, NewsAPI, Custom Hedera Contracts |

---

## ⚙️ Running the Project

```bash
# Clone the repository
git clone https://github.com/csking101/Sentinel-Protocol.git
cd Sentinel-Protocol

# Install dependencies (frontend and AI)
cd frontend && npm install

# Run backend (Next.js)
npm run dev
````

Trigger orchestration manually:

```bash
curl -X POST http://localhost:3000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"triggerReason": "Market crash detected", "portfolio": {"ETH": 100, "USDC": 1000}}'
```

---

## Deployment
- The Hedera Reputation Smart Contract - [https://repo.sourcify.dev/11155111/0x672273a0f08D25EbFF13748cDFb3Fb45105070B3](https://repo.sourcify.dev/11155111/0x672273a0f08D25EbFF13748cDFb3Fb45105070B3)
- The Base Sepolia Reputation Smart Contract - [https://hashscan.io/testnet/contract/0.0.7131213](https://hashscan.io/testnet/contract/0.0.7131213)
- Vincent Ability NPM - [https://www.npmjs.com/package/@sentinel-protocol/swap-tokens-hedera-testnet]

---

## 🤝 Sponsors & Acknowledgments

This project is made possible by:

### 🪶 **Hedera**

Powering the **Agent-to-Agent (A2A)** communication and decentralized reputation computation layer.

### 🧠 **Pyth Network**

Providing **real-time market data** and **verifiable randomness (Entropy)** for stochastic modeling and risk scoring.

### 🔐 **Lit Protocol / Vincent**

Enabling **secure authorization** and **non-custodial execution** of portfolio actions.

---

## 🧾 License

MIT License © 2025 

---

> *Sentinel Protocol brings intelligence, transparency, and safety to decentralized finance — one agent at a time.*

```

