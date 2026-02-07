# 🧭 Stop-Loss Trading Bot [Project ID: P-12334]

An automated cryptocurrency trading bot that monitors ETH prices and executes stop-loss trades across multiple DEX aggregators and blockchain networks to protect your investments from significant price drops.

## 📚 Table of Contents
[About](#about)
[Features](#features)
[Tech Stack](#tech-stack)
[Installation](#installation)
[Usage](#usage)
[Configuration](#configuration)
[Screenshots](#screenshots)
[API Documentation](#api-documentation)
[Contact](#contact)

## 🧩 About

This project provides an automated stop-loss trading solution for cryptocurrency traders who want to protect their ETH investments from sudden market downturns. The bot continuously monitors ETH prices and automatically executes trades to convert ETH to stablecoins (USDT, USDC, or DAI) when the price drops below a configured threshold. It supports multiple blockchain networks (Ethereum, Arbitrum, Base, Optimism) and integrates with leading DEX aggregators to ensure optimal trade execution.

**Key Goals:**
- Automate stop-loss trading to minimize manual monitoring
- Support multiple DEX aggregators for best execution prices
- Provide trailing stop-loss functionality for dynamic price protection
- Offer a user-friendly web interface for configuration and monitoring

## ✨ Features

**Multi-Chain Support** – Trade on Ethereum, Arbitrum, Base, and Optimism networks

**DEX Aggregator Integration** – Supports CowSwap, 1inch, and Velora (Paraswap) for optimal trade routing

**Trailing Stop-Loss** – Dynamic stop-loss that adjusts as price moves in your favor

**Price Simulation Mode** – Test bot behavior with simulated prices without real trades

**Partial Fill Support** – Handle orders that execute across multiple transactions

**Real-Time Monitoring** – Live price tracking, transaction history, and usage logs

**Flexible Configuration** – Customizable slippage, gas priority, cooldown periods, and price buffers

## 🧠 Tech Stack

**Languages:** JavaScript (ES6+)

**Frameworks:** Express.js, Node.js

**Blockchain:** Web3.js, Ethers.js

**Database:** MongoDB (Mongoose)

**DEX SDKs:** @1inch/fusion-sdk, @cowprotocol/cow-sdk, @paraswap/sdk

**Tools:** dotenv, CORS, EJS

## ⚙️ Installation

# Clone the repository
git clone https://github.com/yourusername/Stop_loss-TradingBot-Version4.git

# Navigate to the project directory
cd Stop_loss-TradingBot-Version4

# Install dependencies
npm install

## 🚀 Usage

# Start the development server
npm start

Then open your browser and go to:
👉 [http://localhost:8888](http://localhost:8888)

## 🧾 Configuration

Create a `.env` file in the root directory with the following environment variables:

```
PORT=8888
MONGODB_URI=your_mongodb_connection_string_here
PRIVATE_KEY=your_wallet_private_key_here
```

**Note:** Ensure your wallet has sufficient ETH for gas fees and the tokens you wish to trade.

## 🖼 Screenshots

_Add demo images, GIFs, or UI preview screenshots here._

## 📜 API Documentation

The bot exposes the following REST API endpoints:

**Bot Control:**
- `POST /api/bot/start` – Start the trading bot
- `POST /api/bot/stop` – Stop the trading bot
- `GET /api/bot/config` – Retrieve current bot configuration

**Simulation:**
- `POST /api/simulation/enable` – Enable price simulation mode

**Logs:**
- `GET /api/logs` – Retrieve bot usage logs
- `POST /api/logs/status` – Update log status

**Price:**
- `GET /api/price` – Get current ETH price

**Transactions:**
- `GET /api/transactions/history` – Get transaction history
- `GET /api/transactions/latest` – Get latest transaction
- `DELETE /api/transactions/clear` – Clear transaction history

**Wallet:**
- `GET /api/wallet/balance` – Get wallet balance
- `GET /api/wallet/address` – Get connected wallet address

## 📬 Contact

**Author:** [Your Name]

**Email:** your.email@example.com

**GitHub:** @yourgithub

**Website/Portfolio:** yourwebsite.com

## 🌟 Acknowledgements

- **1inch Network** – For providing the Fusion SDK for decentralized exchange aggregation
- **CowSwap** – For the Cow Protocol SDK enabling gasless and MEV-protected trades
- **ParaSwap** – For the ParaSwap SDK offering efficient token swaps across multiple DEXs
- **Ethers.js** – For comprehensive Ethereum blockchain interaction capabilities
- **Web3.js** – For Web3 integration and blockchain connectivity
- **MongoDB** – For reliable data persistence and transaction history storage
- **Express.js** – For building the robust backend API server
- **Toastr** – For user-friendly notification system in the frontend
