import mongoose from "mongoose";

const stationDirSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  city: String,
  platforms: Number,
  trains: Number,
  status: String
}, { timestamps: true });

export default mongoose.model("Station", stationDirSchema);
