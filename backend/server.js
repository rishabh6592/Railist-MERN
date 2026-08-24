import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import trainRoutes from "./routes/trains.js";
import pnrRoutes from "./routes/pnr.js";
import feedbackRoutes from "./routes/feedback.js";
import stationRoutes from "./routes/stations.js";
import { fetchLiveStationTrains, isLive } from "./services/railwayApi.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "Railist API", liveMode: isLive });
});

// Real-time Dynamic Live Station Board API (Pure India)
app.get("/api/stations/:code/live", async (req, res) => {
  try {
    const { code } = req.params;
    const { hours } = req.query;
    const cleanCode = (code || "").toUpperCase().trim();

    if (!cleanCode) {
      return res.status(400).json({ success: false, message: "Station code is required" });
    }

    const liveTrains = await fetchLiveStationTrains(cleanCode, Number(hours) || 6);

    return res.json({
      success: true,
      stationCode: cleanCode,
      count: liveTrains.length,
      data: liveTrains,
    });
  } catch (error) {
    console.error(`Live station endpoint error for ${req.params.code}:`, error.message);
    return res.status(500).json({ success: false, message: "Error fetching station departures" });
  }
});

// App Routers
app.use("/api/trains", trainRoutes);
app.use("/api/pnr", pnrRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/stations", stationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong on the server" });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚆 Railist API running on http://localhost:${PORT}`));
});