import Config from "../models/config.js";
import { addInfo } from "../routes/logs.js";
import { startMonitoring, stopMonitoring } from "../service/monitoring.js";
import { BOT_STATE } from "../utils/constants.js";
export const botStart = async (req, res) => {
  const {
    stopLossPrice,
    initialAmount,
    selectedStablecoin,
    slippage,
    gasPriority,
    buffer,
    cooldown,
    isUSDMode,
    trailingStopEnabled,
    trailingThreshold,
    trailingAmount,
    partialFill,
    chainId,
    dexAggregator,
  } = req.body;

  let config = await Config.findOne();

  if (config) {
    config.isActive = true;
    config.stopLossPrice = stopLossPrice;
    config.initialAmount = initialAmount;
    config.selectedStablecoin = selectedStablecoin;
    config.slippage = slippage;
    config.gasPriority = gasPriority;
    config.buffer = buffer;
    config.cooldown = cooldown;
    config.isUSDMode = isUSDMode;
    config.trailingStopEnabled = trailingStopEnabled;
    config.trailingThreshold = trailingThreshold;
    config.trailingAmount = trailingAmount;
    config.partialFill = partialFill;
    config.dex = dexAggregator;
    config.chainId = chainId;

    await config.save();
  } else {
    config = new Config({
      isActive: true,
      stopLossPrice,
      initialAmount,
      selectedStablecoin,
      slippage,
      gasPriority,
      buffer,
      cooldown,
      isUSDMode,
      trailingStopEnabled,
      trailingThreshold,
      trailingAmount,
      partialFill,
      dex: dexAggregator,
      chainId,
    });
    await config.save();
  }

  BOT_STATE.isRunning = true;
  let timestamp = new Date().toUTCString();
  console.log("Starting monitoring...", config);

  startMonitoring(config);
  addInfo({
    message: "Bot started successfully",
    timestamp: timestamp,
    isRead: true,
  });
  res.json({ success: true, message: "Bot started successfully" });
};

export const botStop = async (req, res) => {
  const config = await Config.findOne();
  if (!config) {
    return res.json({ success: false, message: "Config not found" });
  }

  if (config) {
    await Config.deleteOne();
  }

  BOT_STATE.isRunning = false;
  await stopMonitoring();
  res.json({ success: true, message: "Bot stopped successfully" });
};

export const botConfig = async (req, res) => {
  const config = await Config.findOne();
  if (!config) {
    return res.json({ success: false, message: "Config not found" });
  }
  res.json(config);
};
