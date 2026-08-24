import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("ℹ️  MONGO_URI not set — running with demo data.");
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3500 });
    console.log("✅ MongoDB connected");
    return true;
  } catch (error) {
    console.warn("⚠️  MongoDB unavailable — running with demo data.");
    return false;
  }
}
