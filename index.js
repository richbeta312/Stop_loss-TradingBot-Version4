import "dotenv/config";

import express from "express";
import cors from "cors";
import connectDB from "./utils/connectDB.js";

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getInfo, updateStatus } from "./routes/logs.js";
import { botStart, botStop, botConfig } from "./routes/botConfig.js";
import { getClientETHPrice } from "./routes/price.js";
import { enableSimulation } from "./service/monitoring.js";
import {
  getLastestTransaction,
  getTransactionHistory,
  deleteTransactions,
} from "./routes/transactions.js";
import { walletBalance, getAddress } from "./routes/wallet.js";
import { PORT } from "./utils/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
connectDB();
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/bot/start", botStart);
app.post("/api/bot/stop", botStop);
app.get("/api/bot/config", botConfig);

app.post("/api/simulation/enable", enableSimulation);

app.get("/api/logs", getInfo);
app.post("/api/logs/status", updateStatus);

app.get("/api/price", getClientETHPrice);
app.get("/api/transactions/history", getTransactionHistory);
app.get("/api/transactions/latest", getLastestTransaction);
app.delete("/api/transactions/clear", deleteTransactions);

app.get("/api/wallet/balance", walletBalance);
app.get("/api/wallet/address", getAddress);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
