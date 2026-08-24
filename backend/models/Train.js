import mongoose from "mongoose";

const stationSchema = new mongoose.Schema({
  name: String,
  code: String,
  scheduled: String,
  actual: String,
  delay: Number,
  status: String
}, { _id: false });

const trainSchema = new mongoose.Schema({
  number: { type: String, unique: true },
  name: String,
  from: String,
  fromCode: String,
  to: String,
  toCode: String,
  platform: String,
  status: String,
  delay: Number,
  currentLocation: String,
  currentCode: String,
  nextStop: String,
  nextCode: String,
  speed: Number,
  stations: [stationSchema]
}, { timestamps: true });

export default mongoose.model("Train", trainSchema);
