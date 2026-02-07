import "dotenv/config";

import Web3 from "web3";
import {
  getDecimals,
  SaveOrder,
  scanWalletAndUpdateTransaction,
} from "../utils/functions.js";
import { ethers, Contract } from "ethers";
import { FusionSDK, PrivateKeyProviderConnector } from "@1inch/fusion-sdk";
import { TradingSdk, OrderKind } from "@cowprotocol/cow-sdk";
import { executeWithRetry } from "../utils/functions.js";
import axios from "axios";
import {
  ERC20_ABI,
  LIMIT_ORDER_CONTRACT,
  COWSWAP_CONTRACT,
  TOKENS,
} from "../utils/constants.js";
import { constructSimpleSDK } from "@paraswap/sdk";

export const veloraRouter = async (txData) => {
  let {
    chainId,
    fromToken,
    toToken,
    amount,
    gasPriority,
    slippage,
    partialFill = false,
  } = txData;

  try {
    if (slippage == "Auto") {
      slippage = 1;
    } else {
      slippage = Number(slippage);
    }

    console.log("Velora request:", txData);

    const networkMap = {
      1: "ethereum",
      42161: "arbitrum",
      10: "optimism",
      8453: "base",
    };

    const network = networkMap[chainId];
    if (!network) {
      return;
    }

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
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const simpleSDK = constructSimpleSDK(
      { chainId: chainId, axios },
      {
        ethersProviderOrSigner: wallet,
        EthersContract: ethers.Contract,
        account: wallet.address,
      }
    );

    const srcDecimals = await getDecimals(chainId, TOKENS[chainId][fromToken]);
    const toDecimals = await getDecimals(chainId, TOKENS[chainId][toToken]);

    const DeltaContract = await simpleSDK.delta.getDeltaContract();
    const srcAmount = amount * 10 ** srcDecimals;

    const tokenContract = new Contract(
      TOKENS[chainId][fromToken],
      ERC20_ABI,
      wallet
    );

    const currentAllowance = await tokenContract.allowance(
      wallet.address,
      DeltaContract
    );

    if (
      currentAllowance.lt(
        ethers.BigNumber.from(Math.floor(srcAmount).toString())
      )
    ) {
      try {
        console.log("Approving token...");
        const approveTx = await tokenContract.approve(
          DeltaContract,
          ethers.constants.MaxUint256
        );
        console.log("Approval transaction sent:", approveTx.hash);
        await approveTx.wait();
        console.log("Approval confirmed");
      } catch (error) {
        console.error("Approval error:", error);
        return res
          .status(500)
          .json({ error: "Failed to approve token: " + error.message });
      }
    } else {
      console.log("Sufficient allowance already exists");
    }

    await executeWithRetry(async () => {
      const quote = await simpleSDK.quote.getQuote({
        srcToken: TOKENS[chainId][fromToken],
        destToken: TOKENS[chainId][toToken],
        amount: srcAmount.toString(),
        userAddress: wallet.address,
        srcDecimals: srcDecimals,
        destDecimals: toDecimals,
        mode: "delta",
        side: "SELL",
      });

      const deltaPrice = quote.delta;

      const signableOrderData = await simpleSDK.delta.buildDeltaOrder({
        deltaPrice,
        owner: wallet.address,
        srcToken: TOKENS[chainId][fromToken],
        destToken: TOKENS[chainId][toToken],
        srcAmount: srcAmount.toString(),
        destAmount: Math.floor(
          deltaPrice.destAmount * (1 - slippage / 100)
        ).toString(),
      });
      console.log("-----signableOrderData------->", signableOrderData);

      const signature = await simpleSDK.delta.signDeltaOrder(signableOrderData);
      console.log("Signature------>", signature);

      const deltaAuction = await simpleSDK.delta.postDeltaOrder({
        partiallyFillable: partialFill,
        order: signableOrderData.data,
        signature,
      });

      console.log("deltaAuction:------->", deltaAuction);

      const lastOrderTime = new Date().getTime();

      const transaction = await SaveOrder(
        {
          chainId,
          fromToken,
          toToken,
          amount: srcAmount,
          slippage,
          decimals: srcDecimals,
          partialFill,
        },
        "Velora"
      );

      const updateTransaction = await scanWalletAndUpdateTransaction(
        wallet.address,
        transaction,
        lastOrderTime,
        chainId,
        "Velora"
      ).catch((error) => console.error("Error scanning wallet:", error));
    });
  } catch (error) {
    console.error("Velora error:", error);
  }
};

export const cowswapRouter = async (txData) => {
  let {
    chainId,
    fromToken,
    toToken,
    amount,
    slippage,
    partialFill = false,
  } = txData;

  console.log("Received request to swap tokens using CowSwap");
  console.log(txData);

  if (slippage == "Auto") {
    slippage = 1;
  } else {
    slippage = Number(slippage);
  }

  try {
    const decimals = await getDecimals(chainId, TOKENS[chainId][fromToken]);
    amount = amount * 10 ** decimals;
    console.log("Token decimals:", decimals);
    console.log("Token amount:", amount);
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

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const sdk = new TradingSdk({
      chainId: chainId,
      signer: wallet,
    });

    const tokenContract = new Contract(
      TOKENS[chainId][fromToken],
      ERC20_ABI,
      wallet
    );

    const currentAllowance = await tokenContract.allowance(
      wallet.address,
      COWSWAP_CONTRACT
    );

    console.log("Current allowance:", currentAllowance.toString());

    if (
      currentAllowance.lt(ethers.BigNumber.from(Math.floor(amount).toString()))
    ) {
      try {
        const approveTx = await tokenContract.approve(
          COWSWAP_CONTRACT,
          ethers.constants.MaxUint256
        );
        await approveTx.wait();
      } catch (error) {
        console.error("Approval error:", error);
        return;
      }
    }

    const parameters = {
      kind: OrderKind.SELL,
      sellToken: TOKENS[chainId][fromToken],
      sellTokenDecimals: decimals,
      buyToken: TOKENS[chainId][toToken],
      buyTokenDecimals: decimals,
      amount: Math.floor(amount).toString(),
      slippageBps: slippage * 100,
      partiallyFillable: partialFill,
    };

    console.log("Parameters:", parameters);

    const orderId = await executeWithRetry(() => sdk.postSwapOrder(parameters));
    console.log("Order ID:", orderId);
    const lastOrderTime = new Date().getTime();

    const transaction = await SaveOrder(
      {
        chainId,
        fromToken,
        toToken,
        amount,
        slippage,
        decimals,
        partialFill,
      },
      "CowSwap"
    );

    const updateTransaction = await scanWalletAndUpdateTransaction(
      wallet.address,
      transaction,
      lastOrderTime,
      chainId,
      "CowSwap"
    ).catch((error) => console.error("Error scanning wallet:", error));
  } catch (error) {
    console.error("Fill order error:", error);
  }
};

export const inchswapRouter = async (txData) => {
  let {
    chainId,
    fromToken,
    toToken,
    amount,
    gasPriority,
    slippage,
    partialFill = false,
  } = txData;

  if (slippage == "Auto") {
    slippage = 1;
  } else {
    slippage = Number(slippage);
  }
  try {
    const decimals = await getDecimals(chainId, TOKENS[chainId][fromToken]);
    amount = amount * 10 ** decimals;
    console.log("request body", txData);

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
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const tokenContract = new Contract(
      TOKENS[chainId][fromToken],
      ERC20_ABI,
      wallet
    );

    const blockchainProvider = new PrivateKeyProviderConnector(
      process.env.PRIVATE_KEY,
      new Web3(rpc_url)
    );

    const sdk = new FusionSDK({
      url: process.env.INCH_API_SWAP_URL,
      network: chainId,
      blockchainProvider,
      authKey: process.env.INCH_API_KEY,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const currentAllowance = await tokenContract.allowance(
      wallet.address,
      LIMIT_ORDER_CONTRACT
    );

    if (
      currentAllowance.lt(ethers.BigNumber.from(Math.floor(amount).toString()))
    ) {
      try {
        const approveTx = await tokenContract.approve(
          LIMIT_ORDER_CONTRACT,
          ethers.constants.MaxUint256
        );

        await approveTx.wait(1);
        await tokenContract.allowance(wallet.address, LIMIT_ORDER_CONTRACT);
      } catch (error) {
        console.error("Approval error:", error);
        return res
          .status(500)
          .json({ error: "Failed to approve token: " + error.message });
      }
    } else {
      console.log("Sufficient allowance already exists");
    }
    
    const orderId = await executeWithRetry(async () => {
      const params = {
        fromTokenAddress: TOKENS[chainId][fromToken],
        toTokenAddress: TOKENS[chainId][toToken],
        amount: Math.floor(amount).toString(),
        walletAddress: wallet.address,
        preset: gasPriority,
        allowPartialFills: partialFill,
        source: "1inch",
      };

      await sdk.getQuote(params);
      const preparedOrder = await sdk.createOrder(params);
      return await sdk.submitOrder(preparedOrder.order, preparedOrder.quoteId);
    });

    console.log("Order ID:", orderId);
    const lastOrderTime = new Date().getTime();

    const transaction = await SaveOrder(
      {
        chainId,
        fromToken,
        toToken,
        amount,
        slippage,
        decimals,
        partialFill,
      },
      "1inch"
    );

    const updateTransaction = await scanWalletAndUpdateTransaction(
      wallet.address,
      transaction,
      lastOrderTime,
      chainId,
      "1inch"
    ).catch((error) => console.error("Error scanning wallet:", error));
  } catch (error) {
    console.error("Fill order error:", error);
  }
};
