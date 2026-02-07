import "dotenv/config";
import { ethers } from "ethers";
import { TOKENS } from "../utils/constants.js";

export const walletBalance = async (req, res) => {
  try {
    const { chain } = req.query;
    const chainId = parseInt(chain);

    if (!chainId) {
      return res
        .status(400)
        .json({ error: "Missing or invalid chain parameter" });
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

    const ethBalanceWei = await provider.getBalance(wallet.address);
    const ethBalance = ethers.utils.formatEther(ethBalanceWei);

    const tokenSymbols = ["WETH", "USDT", "USDC", "DAI"];

    const erc20Abi = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];

    const balancePromises = tokenSymbols.map(async (symbol) => {
      try {
        const tokenAddress = TOKENS[chainId][symbol];
        if (!tokenAddress) {
          console.warn(`Token ${symbol} not available on chain ${chainId}`);
          return [symbol.toLowerCase(), "0"];
        }

        const tokenContract = new ethers.Contract(
          tokenAddress,
          erc20Abi,
          provider
        );

        const [balanceWei, decimals] = await Promise.all([
          tokenContract.balanceOf(wallet.address),
          tokenContract.decimals(),
        ]);

        const balance = ethers.utils.formatUnits(balanceWei, decimals);
        return [symbol.toLowerCase(), balance];
      } catch (error) {
        console.error(`Error fetching ${symbol} balance:`, error);
        return [symbol.toLowerCase(), "0"];
      }
    });

    const tokenBalanceEntries = await Promise.all(balancePromises);

    const tokenBalances = Object.fromEntries(tokenBalanceEntries);

    const allBalances = {
      eth: ethBalance,
      ...tokenBalances,
    };

    return res.json(allBalances);
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return res.status(500).json({ error: error.message });
  }
};
export const getAddress = async (req, res) => {
  try {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const address = wallet.address;
    res.json({ address });
  } catch (error) {
    console.error("Error getting wallet address:", error);
    res.status(500).json({ error: error.message });
  }
};
