import mongoose from "mongoose";
const HisotrySchema = new mongoose.Schema({
  chainId: {
    type: Number,
  },

  dex: {
    type: String,
    enum: ["1inch", "CowSwap", "Velora"],
  },

  txHash: {
    type: String,
    default: "",
  },

  uniqueId: {
    type: String,
    default: "",
  },
});

export default mongoose.model("Hisotry", HisotrySchema);