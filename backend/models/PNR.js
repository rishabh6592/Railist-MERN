import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  status: String,
  berth: String
}, { _id: false });

const pnrSchema = new mongoose.Schema({
  pnr: { type: String, unique: true },
  trainNumber: String,
  trainName: String,
  date: String,
  from: String,
  to: String,
  chartStatus: String,
  passengers: [passengerSchema]
}, { timestamps: true });

export default mongoose.model("PNR", pnrSchema);
