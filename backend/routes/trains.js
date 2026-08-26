import { Router } from "express";
import Train from "../models/Train.js";
import {
  isLive,
  fetchLiveTrainStatus
} from "../services/railwayApi.js";

const router = Router();

let demoTrains = [];

export function setDemoTrains(data) {
  demoTrains = data;
}

// =====================================================
// SIMPLE IN-MEMORY CACHE (saves RailRadar quota)
// =====================================================
const liveCache = new Map();
const LIVE_CACHE_TTL = 90 * 1000; // 90 seconds — same train requested again soon uses cached copy

function getCached(key) {
  const entry = liveCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > LIVE_CACHE_TTL) {
    liveCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  liveCache.set(key, { data, timestamp: Date.now() });
}

// =====================================================
// GET ALL TRAINS
// /api/trains
// =====================================================
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "")
      .trim()
      .toLowerCase();

    // Get trains from MongoDB if connected,
    // otherwise use demo trains.
    const source =
      Train.db.readyState === 1
        ? await Train.find().lean()
        : demoTrains;

    const filtered = q
      ? source.filter((t) =>
          [
            t.number,
            t.name,
            t.from,
            t.to,
            t.fromCode,
            t.toCode,
            t.currentLocation,
            t.currentCode
          ].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(q)
          )
        )
      : source;

    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

// =====================================================
// GET SINGLE TRAIN (WITH DATE / PAST-DAY SUPPORT)
// /api/trains/:number?date=YYYY-MM-DD
// =====================================================
router.get("/:number", async (req, res, next) => {
  const number = req.params.number;
  const requestedDate = req.query.date;

  // Calculate day difference (0 = Today, 1 = Yesterday, 2 = 2 days ago, etc.)
  let startDay = 0;
  if (requestedDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reqD = new Date(requestedDate);
    reqD.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - reqD.getTime();
    startDay = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  }

  const cacheKey = `${number}_${requestedDate || "today"}`;

  // ---------------------------------------------------
  // 1. Try LIVE RailRadar / Third-Party API first (with cache)
  // ---------------------------------------------------
  if (isLive) {
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    try {
      console.log(`🚆 Fetching train: ${number} for date: ${requestedDate || "Today"} (startDay: ${startDay})`);

      const live = await fetchLiveTrainStatus(number, startDay, requestedDate);

      if (live) {
        console.log(`✅ Train data received for ${number}`);
        setCached(cacheKey, live);
        return res.json(live);
      }
    } catch (error) {
      console.warn(
        `⚠️ Live train lookup failed for ${number}:`,
        error.message
      );
      console.log("↩️ Falling back to MongoDB/demo data...");
    }
  }

  // ---------------------------------------------------
  // 2. Fallback to MongoDB / Demo data
  // ---------------------------------------------------
  try {
    let train =
      Train.db.readyState === 1
        ? await Train.findOne({ number }).lean()
        : demoTrains.find(
            (t) => String(t.number) === String(number)
          );

    if (!train) {
      return res.status(404).json({
        message: "Train not found"
      });
    }

    // Clone object to avoid mutating cached demo reference
    train = JSON.parse(JSON.stringify(train));

    // Past date handling for fallback/demo records
    if (startDay > 0) {
      const trainNumSeed = parseInt(String(number).slice(-2), 10) || 5;
      // Date specific varied delay calculation
      const pastDelay = ((trainNumSeed * (startDay + 1) * 9) % 65);

      train.delay = pastDelay;
      train.delayMinutes = pastDelay;
      train.status = "Reached Destination";
      train.runningStatus = "Reached Destination";
      train.currentSpeed = 0;

      const stationList = train.stations || train.route;
      if (Array.isArray(stationList) && stationList.length > 0) {
        const lastSt = stationList[stationList.length - 1];
        train.currentLocation = lastSt.name || lastSt.stationName || train.to;
        train.currentCode = lastSt.code || lastSt.stationCode || train.toCode;
        train.nextStop = "Journey Completed";

        stationList.forEach((st, idx) => {
          st.hasPassed = true;
          st.status = "Departed";
          const progressiveDelay = Math.max(0, pastDelay - Math.floor((stationList.length - 1 - idx) * 3));
          st.delay = progressiveDelay;
          st.delayMinutes = progressiveDelay;
        });
      }
    }

    res.json(train);
  } catch (error) {
    next(error);
  }
});

export default router;