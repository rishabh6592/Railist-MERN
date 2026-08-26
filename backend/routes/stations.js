import express from "express";
import { fetchLiveStationTrains } from "../services/railwayApi.js";

const router = express.Router();

const detailsCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

// Live departure board cache (separate, shorter TTL)
const liveBoardCache = new Map();
const LIVE_BOARD_TTL = 90 * 1000; // 90 seconds

function getLiveCached(key) {
  const entry = liveBoardCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > LIVE_BOARD_TTL) {
    liveBoardCache.delete(key);
    return null;
  }
  return entry.data;
}

function setLiveCached(key, data) {
  liveBoardCache.set(key, { data, timestamp: Date.now() });
}

// Known Hub Metro Stations
const METRO_STATIONS = {
  DELHI: ["NDLS", "DLI", "NZM", "ANVT", "DEC", "DEE", "DSA", "SZMB", "ANVR"],
  KOLKATA: ["HWH", "SDAH", "KOAA", "SHM", "SRC"],
  MUMBAI: ["CSMT", "MMCT", "BDTS", "DR", "LTT", "BVI", "PNVL", "TNA"],
  CHENNAI: ["MAS", "MS", "TBM", "PER", "MSB"],
  BANGALORE: ["SBC", "YPR", "SMVB", "BNC", "BAND"],
  HYDERABAD: ["SC", "HYB", "KCG", "LPI", "CHZ"],
  LUCKNOW: ["LKO", "LJN", "BNZ", "ASH", "DAL"],
  KANPUR: ["CNB", "CPA", "GOY"],
  PATNA: ["PNBE", "PPTA", "RJPB", "DNR", "PNC"],
  AHMEDABAD: ["ADI", "SBT", "MAN"],
  JAIPUR: ["JP", "GADJ", "DPA"],
  NAGPUR: ["NGP", "AJNI"],
  KOCHI: ["ERS", "ERN"]
};

// Major known terminals & large junctions
const KNOWN_MEGA = ["NDLS", "ANVT", "DLI", "NZM", "HWH", "SDAH", "CSMT", "MMCT", "BDTS", "LTT", "PNBE", "CNB", "GKP", "LKO", "PRYJ", "MAS", "ADI", "BSB", "SBC", "SC", "YPR", "SMVB"];

function getMetroTransit(code, name = "") {
  const c = code.toUpperCase();
  for (const [city, list] of Object.entries(METRO_STATIONS)) {
    if (list.includes(c) || name.toUpperCase().includes(city)) {
      return {
        name: `${city.charAt(0) + city.slice(1).toLowerCase()} Metro Terminal Link`,
        dist: "Direct station gate/subway connection (< 200m)"
      };
    }
  }
  return null;
}

// =====================================================
// LIVE DEPARTURE BOARD (UP & DOWN, NEXT N HOURS)
// GET /api/stations/:code/live
// =====================================================
router.get("/:code/live", async (req, res) => {
  const code = String(req.params.code || "").toUpperCase().trim();
  const hours = Number(req.query.hours) || 6;

  if (!code) {
    return res.status(400).json({ success: false, message: "Station code required" });
  }

  const cacheKey = `${code}_${hours}`;
  const cached = getLiveCached(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  try {
    const trains = await fetchLiveStationTrains(code, hours);
    setLiveCached(cacheKey, trains);
    return res.json({ success: true, data: trains });
  } catch (error) {
    console.error(`Error loading live board for ${code}:`, error.message);
    return res.status(500).json({ success: false, message: "Error loading live departures" });
  }
});

router.get("/:code/details", async (req, res) => {
  const code = String(req.params.code || "").toUpperCase().trim();
  const stationName = String(req.query.name || "").trim().toUpperCase();

  if (!code) return res.status(400).json({ success: false, message: "Station code required" });

  const cacheKey = `${code}_${stationName}`;
  const cached = detailsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ success: true, data: cached.data });
  }

  try {
    const liveTrains = await fetchLiveStationTrains(code, 6).catch(() => []);

    // Detect actual platforms from live schedule
    const detectedPf = new Set();
    liveTrains.forEach((t) => {
      if (t.platform && !t.platform.includes("TBA")) {
        const num = parseInt(String(t.platform).replace(/\D/g, ""), 10);
        if (num && !isNaN(num)) detectedPf.add(num);
      }
    });

    const isMega =
      KNOWN_MEGA.includes(code) ||
      stationName.includes("TERMINAL") ||
      stationName.includes("TRM") ||
      stationName.includes("CENTRAL") ||
      stationName.includes("ANAND VIHAR");

    const isJunction =
      stationName.includes("JN") ||
      stationName.includes("JUNCTION") ||
      stationName.includes("CANTT") ||
      ["SV", "CPR", "BJU", "MFP", "AY", "BST", "DEOS", "BTT", "SPJ", "DBG", "KLD", "BBK", "GD"].includes(code);

    const isHalt =
      stationName.includes("HALT") ||
      stationName.includes(" H") ||
      ["RTU", "MJV", "SQW", "HTW", "SVC", "KPS"].includes(code);

    let pfCount;
    let trainsDaily;
    let status = "Operational";
    let facilities = [];
    let entries = [];
    let busInfo = {};
    let metroInfo = getMetroTransit(code, stationName);

    if (isMega) {
      pfCount = Math.max(detectedPf.size > 0 ? Math.max(...detectedPf) : 7, code === "ANVT" ? 7 : code === "NDLS" || code === "HWH" ? 16 : 8);
      trainsDaily = Math.max(liveTrains.length * 4, 110);
      status = "Busy";
      facilities = [
        "IRCTC Executive Lounge & AC Waiting Hall",
        "Retiring Rooms & AC Dormitories (IRCTC)",
        "24x7 Cloak Room Facility",
        "Free High-Speed RailWire Wi-Fi",
        "Escalators & Lifts on all Platforms",
        "Battery Operated Buggy & Wheelchair Support",
        "Food Track Plaza & Multi-Cuisine Food Courts"
      ];
      entries = [
        { side: "Main Front Concourse Entry", notes: "Platform 1, Main Reservation Complex, VIP Lounge, Direct Metro Walkway" },
        { side: "Second Entry / Cabway", notes: "Multi-level parking, Prepaid Taxi & Auto Stand" }
      ];
      busInfo = {
        name: code === "ANVT" ? "Anand Vihar ISBT (Direct Walkway)" : "City Inter-State Bus Terminal (ISBT)",
        dist: code === "ANVT" ? "Connected (100m)" : "400m - 1.2 km"
      };
      if (code === "ANVT" && !metroInfo) {
        metroInfo = { name: "Anand Vihar Metro Station (Blue & Pink Line)", dist: "Direct Concourse Subway (100m)" };
      }
    } else if (isJunction && !isHalt) {
      pfCount = Math.max(detectedPf.size > 0 ? Math.max(...detectedPf) : 4, 4);
      trainsDaily = Math.max(liveTrains.length * 4, 45);
      status = "Operational";
      facilities = [
        "Upper Class & General Waiting Hall",
        "IRCTC Retiring Rooms (Platform 1)",
        "Cloak Room Facility",
        "Free High-Speed RailWire Wi-Fi",
        "Foot Overbridge with Ramp / Lift",
        "Water ATMs & Refreshment Stalls"
      ];
      entries = [
        { side: "Main Station Entry (Platform 1 Side)", notes: "Ticket Booking Office, Station Master Office, Market Link" },
        { side: "Platform End Exit", notes: "Circulating parking area and 24x7 auto stand" }
      ];
      busInfo = { name: "Government Roadways Bus Stand", dist: "800m - 1.5 km" };
      if (!metroInfo) {
        metroInfo = { name: "Local E-Rickshaw & 24x7 Auto Stand", dist: "Station Front Porch" };
      }
    } else {
      // Small Station / Rural Halt
      pfCount = detectedPf.size > 0 ? Math.max(...detectedPf) : 2;
      trainsDaily = liveTrains.length > 0 ? liveTrains.length * 2 : 12;
      status = "Operational";
      facilities = [
        "Passenger Waiting Shed & Seating Benches",
        "General Unreserved Ticket Counter (UTS)",
        "Handpump & Filtered Drinking Water Booth",
        "Foot Overbridge / Level Crossing",
        "Solar Platform Illumination",
        "Local RPF Patrol Assistance"
      ];
      entries = [
        { side: "Main Approach Road Entry", notes: "Village / Town Link Road, Booking Counter, Main Platform" },
        { side: "Opposite Track Footpath", notes: "Pedestrian village path" }
      ];
      busInfo = { name: "Local Village / Highway Bus Stop", dist: "200m - 500m (Walking distance)" };
      metroInfo = { name: "Local Auto / E-Rickshaw / Tempo Stand", dist: "Station Approach Road" };
    }

    const data = {
      code,
      name: stationName || code,
      platforms: pfCount,
      trainsPerDay: trainsDaily,
      status,
      division: "Indian Railways",
      metro: metroInfo || { name: "Local Auto / E-Rickshaw Stand", dist: "Station Gate" },
      bus: busInfo,
      entries,
      facilities,
      examSpecial: isMega || isJunction
        ? "Special student transport assistance to local testing centers and university colleges."
        : "Local auto / tempo connectivity to nearest Block & Sub-division examination centers.",
      liveTrains
    };

    detailsCache.set(cacheKey, { timestamp: Date.now(), data });
    return res.json({ success: true, data });
  } catch (error) {
    console.error(`Error loading details for ${code}:`, error.message);
    return res.status(500).json({ success: false, message: "Error loading station data" });
  }
});

export default router;