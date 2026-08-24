import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  rating: Number,
  tags: [String],
  message: String
}, { timestamps: true });

export default mongoose.model("Feedback", feedbackSchema);
