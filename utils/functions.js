import "dotenv/config";
import { ethers, Contract } from "ethers";
import axios from "axios";
import Transaction from "../models/transaction.js";
import Hisotry from "../models/history.js";
import { addInfo } from "../routes/logs.js";
import { BOT_STATE } from "../utils/constants.js";

async function SaveOrder(orderDetails, dex) {
  try {
    const {
      chainId,
      fromToken,
      toToken,
      amount,
      slippage = 1,
      decimals,
      partialFill = false,
    } = orderDetails;

    let transaction;

    const network =
      {
        1: "ethereum",
        42161: "arbitrum",
        10: "optimism",
        8453: "base",
      }[chainId] || "ethereum";

    const baseTransaction = {
      chainId,
      network,
      dex,
      fromToken,
      toToken,
      slippage,
      partialFill,
      fillStatus: "pending",
    };

    transaction = new Transaction({
      ...baseTransaction,
      fromAmount: (amount / 10 ** decimals).toString(),
    });

    await transaction.save();

    return transaction;
  } catch (error) {
    console.error("Error tracking order:", error);
  }
}

async function scanWalletAndUpdateTransaction(
  walletAddress,
  transaction,
  lastOrderTime,
  chainId,
  dex
) {
  console.log(
    `Monitoring wallet ${walletAddress} for transaction on chain ${chainId}...`
  );

  const apiUrl =
    chainId === 1
      ? "https://api.etherscan.io/api"
      : chainId === 42161
      ? "https://api.arbiscan.io/api"
      : chainId === 10
      ? "https://api-optimistic.etherscan.io/api"
      : chainId === 8453
      ? "https://api.basescan.org/api"
      : "https://api.etherscan.io/api";

  const apiKey =
    chainId === 1
      ? process.env.ETHERSCAN_API_KEY
      : chainId === 42161
      ? process.env.ARBISCAN_API_KEY
      : chainId === 10
      ? process.env.OPTIMISM_API_KEY
      : chainId === 8453
      ? process.env.BASESCAN_API_KEY
      : process.env.ETHERSCAN_API_KEY;

  let attempts = 0;
  const maxAttempts = 60;

  const currentTransaction = await Transaction.findById(transaction._id);
  const isPartialFill = currentTransaction.partialFill;

  const processedTxHashes = new Set();

  let totalAmountReceived = 0;
  let totalAmountSwaped = 0;
  let fillTransactions = [];
  let anyTransactionFound = false;
  while (attempts < maxAttempts && BOT_STATE.isRunning) {
    try {
      const offset = isPartialFill ? 20 : 1;
      const response = await axios.get(
        `${apiUrl}?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=${offset}&sort=desc&apikey=${apiKey}`
      );

      if (response.data.status === "1" && response.data.result.length > 0) {
        const tokenTxs = response.data.result;
        let updatedInThisAttempt = false;

        for (const tokenTx of tokenTxs) {
          const receivedAmount = Number(
            (tokenTx.value / 10 ** tokenTx.tokenDecimal).toFixed(6)
          );

          if (processedTxHashes.has(tokenTx.hash)) {
            fillTransactions.map((tx) => {
              totalAmountReceived += receivedAmount;

              if (tx.txHash === tokenTx.hash) {
                tx.fromAmount = Number(
                  (tokenTx.value / 10 ** tokenTx.tokenDecimal).toFixed(6)
                ).toString();
              }
            });
          }

          const isIncluded = await Hisotry.findOne({ txHash: tokenTx.hash });
          let timestamp = parseInt(tokenTx.timeStamp) * 1000;

          if (timestamp > lastOrderTime) {
            if (
              !isIncluded &&
              tokenTx.to.toLowerCase() === walletAddress.toLowerCase() &&
              transaction.toToken.toLowerCase() ===
                tokenTx.tokenSymbol.toLowerCase()
            ) {
              processedTxHashes.add(tokenTx.hash);
              console.log("Trasaction:", JSON.stringify(tokenTx));

              totalAmountSwaped += receivedAmount;

              const fillTransaction = {
                txHash: tokenTx.hash,
                timestamp: new Date(timestamp),
                toAmount: receivedAmount.toString(),
              };

              fillTransactions.push(fillTransaction);

              const historyData = {
                chainId,
                dex: dex,
                txHash: tokenTx.hash,
              };

              const newTransaction = new Hisotry(historyData);
              await newTransaction.save();

              anyTransactionFound = true;
              updatedInThisAttempt = true;

              if (!isPartialFill) {
                const updateData = {
                  txHash: tokenTx.hash,
                  fillStatus: "completed",
                  timestamp: new Date(timestamp),
                  toAmount: receivedAmount.toString(),
                  fillTransactions: [fillTransaction],
                };

                const response = await Transaction.findByIdAndUpdate(
                  transaction._id,
                  updateData,
                  {
                    new: true,
                  }
                );

                timestamp = new Date().toUTCString();
                addInfo({
                  message: `Trade executed: ${response.fromToken} → ${response.toToken} Amount: ${response.fromAmount}`,
                  timestamp: timestamp,
                });
                return updateData;
              }
            }
          }
        }

        if (updatedInThisAttempt && isPartialFill) {
          const fillStatus =
            totalAmountReceived >=
            parseFloat(currentTransaction.fromAmount) * 0.97
              ? "completed"
              : "partial";

          const updateData = {
            fillStatus: fillStatus,
            toAmount: totalAmountSwaped.toString(),
            fillTransactions: fillTransactions,
            txHash:
              fillTransactions.length > 0
                ? fillTransactions[fillTransactions.length - 1].txHash
                : "",
          };

          const response = await Transaction.findByIdAndUpdate(
            transaction._id,
            updateData,
            {
              new: true,
            }
          );

          if (fillStatus === "completed") {
            let timestamp = new Date().toUTCString();
            addInfo({
              message: `Trade executed: ${response.fromToken} → ${response.toToken} Amount: ${response.fromAmount}`,
              timestamp: timestamp,
            });
            return updateData;
          }
        }
      }

      attempts++;
      console.log(
        `Attempt ${attempts}/${maxAttempts} - ${
          anyTransactionFound
            ? "Partial fills found, continuing to monitor"
            : "No matching transaction found yet"
        }`
      );
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } catch (error) {
      console.error("Error scanning for transactions:", error);
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }
  }
  if (anyTransactionFound && isPartialFill) {
    const finalUpdateData = {
      fillStatus: "partial",
      toAmount: totalAmountReceived.toString(),
      fillTransactions: fillTransactions,
      txHash:
        fillTransactions.length > 0
          ? fillTransactions[fillTransactions.length - 1].txHash
          : "",
    };

    await Transaction.findByIdAndUpdate(transaction._id, finalUpdateData, {
      new: true,
    });

    return finalUpdateData;
  }
  await Transaction.findByIdAndUpdate(
    transaction._id,
    { fillStatus: "pending" },
    { new: true }
  );

  console.log(`No matching transaction found after ${maxAttempts} attempts`);
  return false;
}
const getDecimals = async (chainId, tokenAddress) => {
  const knownTokenDecimals = {
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": 18, // Ethereum
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": 18, // Arbitrum
    "0x4200000000000000000000000000000000000006": 18, // Optimism, Base
    "0xdAC17F958D2ee523a2206206994597C13D831ec7": 6, // USDT on Ethereum
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": 6, // USDC on Ethereum
    "0x6B175474E89094C44Da98b954EedeAC495271d0F": 18, // DAI on Ethereum
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9": 6, // USDT on Arbitrum
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831": 6, // USDC on Arbitrum
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": 18, // DAI on Arbitrum/Optimism
    "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58": 6, // USDT on Optimism
    "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85": 6, // USDC on Optimism
    "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2": 6, // USDT on Base
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": 6, // USDC on Base
    "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb": 18, // DAI on Base
  };

  if (knownTokenDecimals[tokenAddress]) {
    return knownTokenDecimals[tokenAddress];
  }

  try {
    const rpc_url =
      chainId === 1
        ? process.env.ETH_RPC_URL
        : chainId === 10
        ? process.env.OPTIMISM_RPC_URL
        : chainId === 8453
        ? process.env.BASE_RPC_URL
        : chainId === 42161
        ? process.env.ARBITRUM_RPC_URL
        : process.env.ETH_RPC_URL;

    const provider = new ethers.providers.JsonRpcProvider(rpc_url);

    const tokenContract = new Contract(
      tokenAddress,
      [
        "function decimals() view returns (uint8)",
        "function DECIMALS() view returns (uint8)",
        "function Decimals() view returns (uint8)",
        "function getDecimals() view returns (uint8)",
      ],
      provider
    );

    try {
      const decimals = await tokenContract.decimals();
      return decimals;
    } catch (err) {
      try {
        const decimals = await tokenContract.DECIMALS();
        return decimals;
      } catch (err2) {
        return 18;
      }
    }
  } catch (error) {
    console.error("Error getting decimals:", error);
    return 18;
  }
};
const executeWithRetry = async (
  requestFunction,
  maxRetries = 5,
  baseDelay = 3000
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFunction();
    } catch (error) {
      if (error.response && error.response.status == 400) {
        console.error(
          `Client error (${error.response.status}), not retrying:`,
          error.response?.data || error.message
        );
        throw error;
      }

      const isLastAttempt = attempt === maxRetries - 1;
      if (isLastAttempt) {
        console.error(`Final attempt ${attempt + 1} failed:`, error);
        throw error;
      }

      const jitter = Math.random() * 500;
      const delay = Math.pow(2, attempt) * baseDelay + jitter;

      console.log(
        `Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export {
  getDecimals,
  executeWithRetry,
  SaveOrder,
  scanWalletAndUpdateTransaction,
};
