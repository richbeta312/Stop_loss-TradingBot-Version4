import "dotenv/config";
import axios from "axios";
import { getDecimals } from "../utils/functions.js";
import { TOKENS } from "../utils/constants.js";
export const getETHPrice = async (chainId, stablecoin) => {
  let networkId = Number(chainId);
  try {
    const response = await axios.get(
      `${process.env.INCH_API_URL}/${networkId}/quote`,
      {
        headers: {
          Authorization: `Bearer ${process.env.INCH_API_KEY}`,
          "Content-Type": "application/json",
        },
        params: {
          fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          toTokenAddress: TOKENS[networkId][stablecoin],
          amount: "1000000000000000000",
        },
      }
    );

    const decimals = await getDecimals(chainId, TOKENS[chainId][stablecoin]);
    const price = response.data.dstAmount / Math.pow(10, decimals);
    return price;
  } catch (error) {
    console.error("Error fetching price:", error);
    return;
  }
};

export const getClientETHPrice = async (req, res) => {
  const { chainId, stablecoin } = req.query;
  let networkId = Number(chainId);

  try {
    const response = await axios.get(
      `${process.env.INCH_API_URL}/${networkId}/quote`,
      {
        headers: {
          Authorization: `Bearer ${process.env.INCH_API_KEY}`,
          "Content-Type": "application/json",
        },
        params: {
          fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          toTokenAddress: TOKENS[networkId][stablecoin],
          amount: "1000000000000000000",
        },
      }
    );

    const decimals = await getDecimals(chainId, TOKENS[chainId][stablecoin]);
    const price = response.data.dstAmount / Math.pow(10, decimals);

    res.json(price);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
