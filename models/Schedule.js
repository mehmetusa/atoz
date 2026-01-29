import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  schedule: { type: String, required: true },
  status: { type: String, default: "active" },
  createdAt: { type: Date, default: Date.now },
  lastRun: { type: Date, default: null },
});

export default mongoose.models.Schedule || mongoose.model("Schedule", ScheduleSchema);
