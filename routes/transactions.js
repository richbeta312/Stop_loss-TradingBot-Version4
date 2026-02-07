import Transaction from "../models/transaction.js";
export const getLastestTransaction = async () => {
  try {
    const latestTransaction = await Transaction.findOne()
      .sort({ timestamp: -1 })
      .select(
        "timestamp chainId network dex fromToken toToken fromAmount toAmount price txHash status"
      );

    return latestTransaction;
  } catch (error) {
    return;
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .select(
        "timestamp chainId network dex fromToken toToken fromAmount toAmount price txHash status partialFill fillTransactions fillStatus"
      );

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTransactions = async (req, res) => {
  try {
    await Transaction.deleteMany();
    res.json({ success: true, message: "All transactions have been cleared." });
  } catch (error) {
    console.error("Error clearing transactions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
