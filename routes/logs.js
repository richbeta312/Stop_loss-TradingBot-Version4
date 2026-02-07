import Logs from "../models/logs.js";
export const getInfo = async (req, res) => {
  const data = await Logs.find();
  res.status(200).json({ data });
};
export const addInfo = async (message) => {
  try {
    const newLog = new Logs(message);
    await newLog.save();
  } catch (error) {
    throw new Error("Failed to add log: " + error.message);
  }
};
export const closeInfo = async () => {
  try {
    await Logs.deleteMany({});
  } catch (error) {
    throw new Error("Failed to clear logs: " + error.message);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.body;
    const log = await Logs.findById(id);
    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }
    log.isRead = true;
    await log.save();
    res.status(200).json({ message: "Log status updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update log status: " + error.message });
  }
};