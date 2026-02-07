import { getLastestTransaction } from "../routes/transactions.js";
import {
  veloraRouter,
  inchswapRouter,
  cowswapRouter,
} from "../routes/swap.js";
import { getETHPrice } from "../routes/price.js";
import { closeInfo } from "../routes/logs.js";
import ConfigModel from "../models/config.js";

let isActive = false;
let lastTradeTime = 0;
let currentPosition = "";
let stopLossPrice = 0;
let newStopLossPrice = 0;
let slippage = 1;
let initialAmount = 0;
let currentAmount = 0;
let selectedStablecoin = "";
let buffer = 0;
let cooldown = 5;
let gasPriority = "normal";
let isUSDMode = false;
let trailingStopEnabled = false;
let trailingThreshold = 0;
let trailingAmount = 0;
let highestPrice = 0;
let isTrailingActive = false;
let partialFill = false;
let dex = "";
let chainId = 1;
let isSwapping = false;
let wasSimulationEnabled = false;
let simulatedPriceValue = 0;
const networkMap = {
  ethereum: 1,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
};

const enableTrailingStopLoss = (config) => {
  trailingStopEnabled = true;
  trailingThreshold = parseFloat(config.threshold);
  trailingAmount = parseFloat(config.trailingAmount);
  highestPrice = 0;
  isTrailingActive = false;
};

export const startMonitoring = async (config) => {
  if (!config) {
    console.error("Config not found!!!!!");
    return;
  }
  console.log("Starting monitoring...");

  isActive = config.isActive;
  newStopLossPrice = config.trailingThreshold - config.trailingAmount;
  stopLossPrice = config.stopLossPrice;
  initialAmount = config.initialAmount;
  selectedStablecoin = config.selectedStablecoin;
  slippage = config.slippage;
  gasPriority = config.gasPriority;
  buffer = config.buffer || 0;
  cooldown = config.cooldown || 5;
  isUSDMode = config.isUSDMode;
  trailingStopEnabled = config.trailingStopEnabled;
  trailingThreshold = config.trailingThreshold || 0;
  trailingAmount = config.trailingAmount || 0;
  partialFill = config.partialFill;
  dex = config.dex;
  let chainIdTemp = config.chainId;
  chainId = networkMap[chainIdTemp];
  if (trailingStopEnabled) {
    enableTrailingStopLoss({
      threshold: parseFloat(config.trailingThreshold),
      trailingAmount: parseFloat(config.trailingAmount),
    });
  } else {
    trailingStopEnabled = false;
    isTrailingActive = false;
  }

  const latestTx = await getLastestTransaction();
  if (latestTx) {
    currentAmount = parseFloat(latestTx.toAmount);

    if (latestTx.toToken === selectedStablecoin) {
      currentPosition = "STABLE";
    } else if (latestTx.toToken === "WETH") {
      currentPosition = "WETH";
    } else {
      currentPosition = isUSDMode ? "STABLE" : "WETH";
    }
  } else {
    currentAmount = initialAmount;
    currentPosition = isUSDMode ? "STABLE" : "WETH";
  }

  while (isActive) {
    const currentTime =
      new Date().getTime() - new Date().getTimezoneOffset() * 60000;
    const timeSinceLastTrade = currentTime - lastTradeTime;

    let adjustedStopLoss;
    if (currentPosition === "WETH") {
      adjustedStopLoss = stopLossPrice - buffer;
    } else if (currentPosition === "STABLE") {
      adjustedStopLoss = stopLossPrice + buffer;
    }

    let currentPrice = 0;
    if (wasSimulationEnabled) {
      currentPrice = simulatedPriceValue;
    } else {
      currentPrice = await getETHPrice(chainId, selectedStablecoin);
    }

    const trailingTriggered = updateTrailingStopLoss(currentPrice);

    if (timeSinceLastTrade >= cooldown * 1000) {
      console.log("Checking for trade opportunities...", currentPrice);
      if (trailingTriggered && currentPosition === "WETH") {
        const success = await executeSwap("WETH", selectedStablecoin);
        if (success) {
          currentPosition = "STABLE";
          lastTradeTime = currentTime;
          isTrailingActive = false;
          await countdownCooldown();
        }
      } else if (
        currentPrice < adjustedStopLoss &&
        currentPosition === "WETH" &&
        !trailingTriggered
      ) {
        const success = await executeSwap("WETH", selectedStablecoin);
        if (success) {
          currentPosition = "STABLE";
          lastTradeTime = currentTime;
          await countdownCooldown();
        }
      } else if (
        currentPrice > adjustedStopLoss &&
        currentPosition === "STABLE"
      ) {
        const success = await executeSwap(selectedStablecoin, "WETH");
        if (success) {
          currentPosition = "WETH";
          lastTradeTime = currentTime;
          isTrailingActive = false;
          highestPrice = 0;
          await countdownCooldown();
        }
      }
    }

    if (trailingStopEnabled) {
      const setting = await ConfigModel.findOne();
      setting.newStopLossPrice = newStopLossPrice;
      await setting.save();
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

export const stopMonitoring = async () => {
  isActive = false;
  closeInfo();
};

export const enableSimulation = async (req, res) => {
  try {
    const data = req.body;
    wasSimulationEnabled = data.wasSimulationEnabled;
    simulatedPriceValue = data.simulationPrice;
    const setting = await ConfigModel.findOne();
    if (!setting) {
      return res.status(201).json({ error: "Failed to enable simulation" });
    }
    setting.simulatedPriceValue = simulatedPriceValue;
    setting.wasSimulationEnabled = wasSimulationEnabled;
    await setting.save();
    return res.status(200).json({ message: "Simulation enabled successfully" });
  } catch (error) {
    console.error("Error enabling simulation:", error);
    return res.status(500).json({ error: "Failed to enable simulation" });
  }
};
const updateTrailingStopLoss = (currentPrice) => {
  if (!trailingStopEnabled || currentPosition !== "WETH") return false;

  if (!isTrailingActive && currentPrice >= trailingThreshold - trailingAmount) {
    isTrailingActive = true;
    highestPrice = currentPrice;
    stopLossPrice = highestPrice - trailingAmount;
  }

  if (isTrailingActive) {
    if (currentPrice >= newStopLossPrice + trailingAmount) {
      newStopLossPrice = currentPrice - trailingAmount;
    }

    if (currentPrice < newStopLossPrice - buffer) {
      return true;
    }
  }

  return false;
};

const executeSwap = async (fromToken, toToken) => {
  if (isSwapping) {
    console.log("Swap already in progress. Skipping new swap request.");
    return false;
  }

  isSwapping = true;
  console.log(`Executing swap: ${fromToken} → ${toToken}`);

  const txData = {
    chainId: chainId,
    fromToken,
    toToken,
    amount: currentAmount.toString(),
    slippage: slippage,
    gasPriority: gasPriority,
    partialFill: partialFill,
  };

  const latestTx = await getLastestTransaction();
  if (latestTx) {
    txData.amount = parseFloat(latestTx.toAmount).toString();
  }

  try {
    if (dex === "1inch") {
      await inchswapRouter(txData);
    } else if (dex === "cowswap") {
      await cowswapRouter(txData);
    } else if (dex === "velora") {
      await veloraRouter(txData);
    }
  } catch (error) {
    isSwapping = false;
  }

  isSwapping = false;
  return true;
};

const countdownCooldown = async () => {
  let remainingTime = cooldown;

  while (remainingTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    remainingTime--;
  }
};
