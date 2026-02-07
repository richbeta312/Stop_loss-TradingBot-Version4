# 🧭 Stop-Loss Trading Bot [Project ID: P-339]

An automated cryptocurrency trading bot that monitors ETH prices and executes stop-loss trades across multiple DEX aggregators and blockchain networks to protect your investments from significant price drops.

## 📚 Table of Contents

[About](#-about)
[Features](#-features)
[Tech Stack](#-tech-stack)
[Installation](#️-installation)
[Usage](#-usage)
[Configuration](#-configuration)
[Screenshots](#-screenshots)
[API Documentation](#-api-documentation)
[Contact](#-contact)

## 🧩 About

This project provides an automated stop-loss trading solution for cryptocurrency traders who want to protect their ETH investments from sudden market downturns. The bot continuously monitors ETH prices and automatically executes trades to convert ETH to stablecoins (USDT, USDC, or DAI) when the price drops below a configured threshold. It supports multiple blockchain networks (Ethereum, Arbitrum, Base, Optimism) and integrates with leading DEX aggregators to ensure optimal trade execution.

**Key Goals:**
- Automate stop-loss trading to minimize manual monitoring
- Support multiple DEX aggregators for best execution prices
- Provide trailing stop-loss functionality for dynamic price protection
- Offer a user-friendly web interface for configuration and monitoring

## ✨ Features

- **Multi-Chain Support** – Trade on Ethereum, Arbitrum, Base, and Optimism networks
- **DEX Aggregator Integration** – Supports CowSwap, 1inch, and Velora (Paraswap) for optimal trade routing
- **Trailing Stop-Loss** – Dynamic stop-loss that adjusts as price moves in your favor
- **Price Simulation Mode** – Test bot behavior with simulated prices without real trades
- **Partial Fill Support** – Handle orders that execute across multiple transactions
- **Real-Time Monitoring** – Live price tracking, transaction history, and usage logs
- **Flexible Configuration** – Customizable slippage, gas priority, cooldown periods, and price buffers

## 🧠 Tech Stack

**Languages:** JavaScript (Node.js)

**Frameworks:** Express.js

**Blockchain:** Web3.js, Ethers.js

**Database:** MongoDB (via Mongoose)

**DEX SDKs:** 
- @1inch/fusion-sdk
- @cowprotocol/cow-sdk
- @paraswap/sdk

**Tools:** 
- dotenv
- CORS
- EJS

## ⚙️ Installation

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB instance (local or cloud, e.g., MongoDB Atlas)
- Ethereum wallet with private key
- Sufficient ETH balance for gas fees

### Steps

```bash
# Clone the repository
git clone https://github.com/yourusername/Stop_loss-TradingBot-Version4.git

# Navigate to the project directory
cd Stop_loss-TradingBot-Version4

# Install dependencies
npm install
```

## 🚀 Usage

```bash
# Start the development server
npm start
```

Then open your browser and go to:
👉 [http://localhost:8888](http://localhost:8888)

The server will serve:
- Web interface for bot configuration and monitoring
- RESTful API endpoints under `/api/`

## 🧾 Configuration

Create a `.env` file in the root directory with the following environment variables:

```
PORT=8888
MONGODB_URI=<your-mongodb-connection-string>
PRIVATE_KEY=<your-wallet-private-key>
```

**Important Notes:**
- Ensure your wallet has sufficient ETH for gas fees and the tokens you wish to trade
- Keep your private key secure and never commit it to version control
- For production deployments, use environment variables or secure key management services

## 🖼 Screenshots

_Add demo images, GIFs, or UI preview screenshots here._

## 📜 API Documentation

All endpoints are prefixed with `/api/` and expect JSON bodies where applicable.

### Bot Control

- `POST /api/bot/start` – Start the trading bot
- `POST /api/bot/stop` – Stop the trading bot
- `GET /api/bot/config` – Retrieve current bot configuration

### Simulation

- `POST /api/simulation/enable` – Enable price simulation mode

### Logs

- `GET /api/logs` – Retrieve bot usage logs
- `POST /api/logs/status` – Update log status

### Price

- `GET /api/price` – Get current ETH price

### Transactions

- `GET /api/transactions/history` – Get transaction history
- `GET /api/transactions/latest` – Get latest transaction
- `DELETE /api/transactions/clear` – Clear transaction history

### Wallet

- `GET /api/wallet/balance` – Get wallet balance
- `GET /api/wallet/address` – Get connected wallet address

## 📬 Contact

**Author:** Sora Suzuki

**Email:** sorasuzukirich@gmail.com

**GitHub:** @richbeta312

**Website/Portfolio:** sorasuzuki.vercel.app

## 🌟 Acknowledgements

**Libraries & Frameworks:**
- [Express.js](https://expressjs.com/) – Fast, unopinionated web framework for Node.js
- [Mongoose](https://mongoosejs.com/) – Elegant MongoDB object modeling for Node.js
- [Ethers.js](https://ethers.org/) – Complete Ethereum library and wallet implementation
- [Web3.js](https://web3js.readthedocs.io/) – Ethereum JavaScript API

**DEX Aggregators & SDKs:**
- [1inch Network](https://1inch.io/) – Fusion SDK for decentralized exchange aggregation
- [CowSwap](https://cow.fi/) – Cow Protocol SDK enabling gasless and MEV-protected trades
- [ParaSwap](https://paraswap.io/) – ParaSwap SDK offering efficient token swaps across multiple DEXs

**Platforms & Services:**
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) – Cloud database hosting
- [Ethereum](https://ethereum.org/) – Blockchain network for decentralized applications
- [Arbitrum](https://arbitrum.io/) – Layer 2 scaling solution for Ethereum
- [Base](https://base.org/) – Layer 2 blockchain built on Optimism
- [Optimism](https://www.optimism.io/) – Layer 2 scaling solution for Ethereum

**Additional Resources:**
- Toastr – User-friendly notification system in the frontend

**Community & Resources:**
- Node.js community for excellent documentation and support
- Ethereum developer community for blockchain best practices
- Express.js documentation and middleware ecosystem
