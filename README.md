# 🛡️ Sentinel Protocol

**AI-Powered Web3 Reputation Protocol for Autonomous Portfolio Protection**

Built with **Hedera**, **Pyth Network**, and **Lit Protocol (Vincent)**  
> _Empowering long-term crypto investors through decentralized, AI-driven decision-making._

---

## 📘 Overview

**Sentinel Protocol** is an **AI-powered Web3 reputation protocol** that protects long-term crypto investors by analyzing **news, market feeds, and on-chain reputation**, enabling **user-authorized portfolio actions**.  

The system continuously monitors token credibility, detects market anomalies, and autonomously executes user-approved actions (like swaps, stakes, or rebalances) — ensuring safety during sudden market changes.

🔗 **GitHub:** [https://github.com/csking101/Sentinel-Protocol](https://github.com/csking101/Sentinel-Protocol)

---

## 🚀 Core Idea

Sentinel Protocol introduces a **reputation-driven safeguard layer** for crypto portfolios.  
By combining **AI agents**, **on-chain data**, and **user-controlled execution**, it ensures **non-custodial, transparent, and intelligent portfolio management**.

At its core lies a network of **autonomous agents**:
- **Price Feed Agent** — Fetches real-time prices from **Coingecko** and on-chain **Pyth** feeds  
- **News Feed Agent** — Gathers market sentiment and coin-related headlines  
- **Reputation Agent** — Evaluates token credibility from Hedera-based reputation data  
- **Decision Agent** — Aggregates all inputs and proposes optimal actions  
- **Authorization Agent** — Validates and approves actions before execution  
- **Execution Agent (Vincent)** — Executes approved trades or staking actions via **Lit Protocol**

This system creates a **trust-minimized, intelligent, and self-evolving orchestration** between AI, blockchain data, and decentralized execution.

<!-- Add information about Vincent integration and the cronjob and market trigger here -->


---

## 💡 Architecture

<!-- Add the overall diagram here & the explanation for the flow -->


<!-- Add the AI orchestration diagram here -->
![Architecture Diagram](docs/architecture.png)

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
<!-- Add more info here -->

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
<!-- Add vercel link & vincent relevant stuff  -->


---

## 🧭 Roadmap

* [ ] Finalize reputation sidechain structure on **Hedera**
* [ ] Add **multi-wallet portfolio tracking**
* [ ] Integrate **Vincent** for delegated execution
* [ ] Improve **AI explainability** for decisions
* [ ] Expand to **multi-chain support**
<!-- see if this is needed -->

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

