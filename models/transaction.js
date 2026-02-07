import mongoose from "mongoose";
const TransactionSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },

  chainId: {
    type: Number,
  },

  network: {
    type: String,
  },

  dex: {
    type: String,
    enum: ["1inch", "CowSwap", "Velora"],
  },

  fromToken: {
    type: String,
  },

  toToken: {
    type: String,
  },

  fromAmount: {
    type: String,
  },

  toAmount: {
    type: String,
    default: "0",
  },

  txHash: {
    type: String,
    default: "",
  },

  error: {
    type: String,
    default: "",
  },

  gasFee: {
    type: String,
    enum: ["slow", "medium", "fast"],
    default: "medium",
  },

  slippage: {
    type: Number,
    default: 1,
  },

  partialFill: {
    type: Boolean,
    default: false,
  },

  fillTransactions: {
    type: [
      {
        txHash: String,
        fromAmount: String,
        toAmount: String,
        timestamp: Date,
      },
    ],
    default: [],
  },

  fillStatus: {
    type: String,
    enum: ["pending", "partial", "completed"],
    default: "pending",
  },
});

// Index for faster queries
TransactionSchema.index({ timestamp: -1 });
TransactionSchema.index({ chainId: 1, status: 1 });

export default mongoose.model("Transaction", TransactionSchema);
