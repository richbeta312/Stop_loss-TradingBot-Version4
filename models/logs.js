import mongoose from "mongoose";
const LogsSchema = new mongoose.Schema({
  timestamp: {
    type: String,
    default: "",
  },

  message: {
    type: String,
    default: "",
  },

  isRead: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Logs", LogsSchema);
