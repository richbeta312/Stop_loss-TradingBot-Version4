import mongoose from "mongoose";

const ConfigSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: false,
  },
  isUSDMode: {
    type: Boolean,
    default: false,
  },
  initialAmount: {
    type: Number,
    default: 0,
  },
  selectedStablecoin: {
    type: String,
    default: "USDC",
  },
  stopLossPrice: {
    type: Number,
  },
  slippage: {
    type: String,
    default: "Auto",
  },
  buffer: {
    type: Number,
    default: 0,
  },
  cooldown: {
    type: Number,
    default: 5,
  },
  gasPriority: {
    type: String,
    default: "normal",
  },
  trailingStopEnabled: {
    type: Boolean,
    default: false,
  },
  trailingThreshold: {
    type: Number,
    default: 0,
  },
  trailingAmount: {
    type: Number,
    default: 0,
  },
  partialFill: {
    type: Boolean,
    default: false,
  },
  chainId: {
    type: String,
    default: "ethereum",
  },
  dex: {
    type: String,
    default: "1inch",
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  newStopLossPrice: {
    type: Number,
    default: 0,
  },
  wasSimulationEnabled: {
    type: Boolean,
    default: false,
  },
  simulatedPriceValue: {
    type: Number,
    default: 0,
  },
});

export default mongoose.models.Config || mongoose.model("Config", ConfigSchema);
