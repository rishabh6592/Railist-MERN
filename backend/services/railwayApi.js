import axios from "axios";

// =====================================================
// RailRadar API Client
// =====================================================

const KEY = process.env.RAILRADAR_API_KEY;

const client = axios.create({
  baseURL: "https://api.railradar.in/v1",
  timeout: 12000,
  headers: KEY
    ? {
        Authorization: `Bearer ${KEY}`,
        "x-api-key": KEY,
      }
    : {},
});

export const isLive = Boolean(KEY);

// =====================================================
// HELPERS
// =====================================================

function hhmm(value) {
  if (!value) return "—";

  if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function cleanPlatform(rawPf) {
  if (!rawPf) return null;
  const str = String(rawPf).trim();
  if (["-", "--", "—", "0", "null", "undefined", "Platform —", "TBA"].includes(str)) {
    return null;
  }
  const clean = str.replace(/^PF\s*/i, "").trim();
  return clean ? `PF ${clean}` : null;
}

function stopStatus(status, isCurrent, isJourneyCompleted) {
  if (isJourneyCompleted) return "Departed";
  if (isCurrent) return "Current";
  if (status === "departed" || status === "passed") {
    return "Departed";
  }
  return "Upcoming";
}

const QUOTA_NAMES = {
  GN: "General Quota (GN)",
  TQ: "Tatkal (TQ)",
  PT: "Premium Tatkal (PT)",
  LD: "Ladies Quota (LD)",
  SS: "Senior Citizen (SS)",
  DF: "Defence (DF)",
  HP: "Physically Handicapped (HP)",
  DP: "Duty Pass (DP)",
  FT: "Foreign Tourist (FT)",
  RL: "Remote Location (RL)",
  PQ: "Pooled Quota (PQ)",
  RS: "Road Side (RS)",
};

const CLASS_NAMES = {
  "1A": "First AC (1A)",
  "2A": "Second AC (2A)",
  "3A": "Third AC (3A)",
  "3E": "AC 3 Economy (3E)",
  CC: "AC Chair Car (CC)",
  EC: "Executive Class (EC)",
  EA: "Anubhuti Class (EA)",
  SL: "Sleeper (SL)",
  "2S": "Second Sitting (2S)",
};

// =====================================================
// NORMALIZE LIVE TRAIN STATUS
// =====================================================

function normalizeLiveTrain(data, startDay = 0) {
  if (!data) return null;

  const rawRoute = Array.isArray(data.route)
    ? data.route
    : Array.isArray(data.stations)
    ? data.stations
    : [];

  const cleanStops = rawRoute.filter((r, index, arr) => {
    if (index === 0 || index === arr.length - 1) return true;
    if (r.is_halt !== undefined) return Boolean(r.is_halt);
    if (r.isHalt !== undefined) return Boolean(r.isHalt);
    if (r.isCommercialStop !== undefined) return Boolean(r.isCommercialStop);

    const halt = String(r.halt || r.halt_time || r.haltDuration || "").trim();
    if (halt && halt !== "--" && halt !== "-" && halt !== "00:00" && halt !== "0m" && halt !== "0") {
      return true;
    }

    const arrTime = r.scheduledArrival || r.sch_arr || r.arrival;
    const depTime = r.scheduledDeparture || r.sch_dep || r.departure;
    if (arrTime && depTime && arrTime !== depTime) {
      return true;
    }

    return true;
  });

  const lastStop = cleanStops.length > 0 ? cleanStops[cleanStops.length - 1] : null;
  const isDestinationReached =
    startDay > 0 ||
    data.status === "completed" ||
    data.status === "reached" ||
    data.runningStatus === "completed" ||
    Boolean(lastStop?.hasPassed || lastStop?.status === "departed");

  let currentCode =
    data.currentLocation?.stationCode ||
    data.currentStationCode ||
    data.currentCode ||
    null;

  if (isDestinationReached && lastStop) {
    currentCode = lastStop.stationCode || lastStop.code;
  }

  const currentStation = cleanStops.find(
    (r) => (r.stationCode || r.code) === currentCode
  );

  const resolvedSpeed = isDestinationReached
    ? 0
    : Math.round(
        Number(
          data.currentLocation?.speed ??
          data.currentLocation?.speedKmh ??
          data.speed ??
          data.currentSpeed ??
          data.cur_speed ??
          0
        )
      );

  const finalDelay = Number(
    (isDestinationReached && lastStop
      ? lastStop.delayArrival ?? lastStop.delay ?? data.delayMinutes ?? data.delay
      : data.delayMinutes ?? data.delay ?? data.current_delay) || 0
  );

  const resolvedPlatform = cleanPlatform(
    currentStation?.platform ||
    currentStation?.livePlatform ||
    data.livePlatform ||
    data.platform
  );

  return {
    number: String(data.trainNumber || data.train?.number || data.number || ""),
    name: data.trainName || data.train?.name || data.name || "Express",

    from: data.train?.source?.name || data.from || data.sourceStationName || "",
    fromCode: (data.train?.source?.code || data.fromCode || data.sourceStationCode || "").toUpperCase(),

    to: data.train?.destination?.name || data.to || data.destStationName || (lastStop?.stationName || lastStop?.name || ""),
    toCode: (data.train?.destination?.code || data.toCode || data.destStationCode || (lastStop?.stationCode || lastStop?.code || "")).toUpperCase(),

    platform: resolvedPlatform,

    status: isDestinationReached
      ? "Reached Destination"
      : data.status === "running" || data.runningStatus === "running"
      ? "Live"
      : finalDelay > 0
      ? "Delayed"
      : "On Time",

    delay: finalDelay,

    currentLocation: isDestinationReached
      ? (lastStop?.stationName || lastStop?.name || data.to || "Destination")
      : (currentStation?.stationName ||
         data.currentLocation?.stationName ||
         data.currentLocation?.name ||
         data.currentStation ||
         "En route"),

    currentCode: currentCode || "—",

    nextStop: isDestinationReached
      ? "Journey Completed"
      : (data.nextHalt?.stationName || data.nextStation?.name || data.nextStop || null),
    nextCode: isDestinationReached
      ? null
      : (data.nextHalt?.stationCode || data.nextStation?.code || data.nextCode || null),

    speed: resolvedSpeed,

    stations: cleanStops.map((r) => {
      const stCode = (r.stationCode || r.code || "").toUpperCase();
      const scheduledVal = r.scheduledArrival || r.sch_arr || r.arrival || r.scheduledDeparture || r.sch_dep || r.departure;
      const actualVal = r.actualArrival || r.act_arr || r.actual || r.actualDeparture || r.act_dep;

      return {
        name: r.stationName || r.name,
        code: stCode,
        platform: cleanPlatform(r.platform || r.livePlatform || r.schPlatform),
        scheduled: hhmm(scheduledVal),
        actual: hhmm(actualVal),
        delay: Number(r.delayArrival ?? r.delayDeparture ?? r.delay ?? 0),
        status: stopStatus(r.status, stCode === currentCode, isDestinationReached),
        hasPassed: Boolean(isDestinationReached || r.status === "departed" || r.status === "passed" || r.hasPassed),
      };
    }),
  };
}

export async function fetchLiveTrainStatus(trainNumber, startDay = 0, date = null) {
  if (!isLive) return null;

  try {
    const params = {
      includeCoordinates: true,
    };

    if (startDay > 0) {
      params.start_day = startDay;
      params.startDay = startDay;
    }

    if (date) {
      params.date = date;
      params.journeyDate = date;
    }

    const res = await client.get(`/trains/${trainNumber}/live`, { params });
    const payload = res.data?.data || res.data;

    if (!payload) return null;
    return normalizeLiveTrain(payload, startDay);
  } catch (error) {
    console.error(`Live status API error for ${trainNumber}:`, error.response?.data || error.message);
    return null;
  }
}

// =====================================================
// NORMALIZE LIVE STATION BOARD DEPARTURES
// =====================================================

function normalizeStationTrain(item, station) {
  const train = item?.train || item || {};
  const stop = item?.stop || item?.schedule || {};
  const live = item?.live || item?.runningStatus || {};

  const trainNumber = String(train.number || item.trainNumber || item.number || "").trim();
  const trainName = train.name || item.trainName || item.name || "Express Train";

  const from =
    train.source?.name ||
    train.from ||
    item.sourceStationName ||
    item.sourceStation ||
    item.fromStation ||
    "";
  const fromCode = (
    train.source?.code ||
    train.fromCode ||
    item.sourceStationCode ||
    item.source ||
    item.fromCode ||
    ""
  ).toUpperCase();

  const to =
    train.destination?.name ||
    train.to ||
    item.destStationName ||
    item.destinationStation ||
    item.toStation ||
    "";
  const toCode = (
    train.destination?.code ||
    train.toCode ||
    item.destStationCode ||
    item.destination ||
    item.toCode ||
    ""
  ).toUpperCase();

  const delayMins = Number(live.delayMinutes ?? item.delayMinutes ?? item.delay ?? 0);

  let status = "On Time";
  if (live.type === "at-station" || live.status === "arrived" || item.status === "Arrived") {
    status = "Live";
  } else if (live.type === "departed" || live.status === "departed" || item.status === "Departed") {
    status = "Departed";
  } else if (delayMins > 10) {
    status = "Delayed";
  }

  const pf = cleanPlatform(
    live.platform ||
    live.livePlatform ||
    stop.platform ||
    item.platform ||
    item.livePlatform ||
    train.platform
  );

  const schTime = hhmm(
    stop.departure ||
    stop.arrival ||
    live.scheduledDepartureTime ||
    live.scheduledArrivalTime ||
    item.scheduledDeparture ||
    item.scheduledArrival ||
    item.schDep ||
    item.schArr
  );

  const actTime = hhmm(
    live.expectedDepartureTime ||
    live.expectedArrivalTime ||
    live.actualDepartureTime ||
    item.actualDeparture ||
    item.actualArrival ||
    item.actDep ||
    item.actArr
  );

  const finalTime = schTime !== "—" ? schTime : actTime;

  return {
    number: trainNumber,
    name: trainName,
    from,
    fromCode,
    to,
    toCode,
    platform: pf,
    status,
    delay: delayMins,
    departureTime: finalTime,
    time: finalTime,
    currentLocation: station.name || station.code || "En route",
    currentCode: (station.code || "").toUpperCase(),
    stations: [
      {
        name: station.name || station.code,
        code: (station.code || "").toUpperCase(),
        platform: pf,
        scheduled: schTime,
        actual: actTime,
        delay: delayMins,
        status,
      },
    ],
  };
}

// =====================================================
// FETCH REAL-TIME LIVE STATION TRAINS (PURE DYNAMIC)
// =====================================================

export async function fetchLiveStationTrains(stationInput, hours = 6) {
  if (!isLive) {
    console.warn("RAILRADAR_API_KEY is not set in backend .env");
    return [];
  }

  const rawCode = String(stationInput || "").trim().toUpperCase();
  if (!rawCode) return [];

  try {
    const res = await client.get(`/stations/${rawCode}/live`, {
      params: {
        hours: Number(hours) || 6,
        includeIntermediate: true,
      },
    });

    const payload = res.data;
    const rawStation = payload?.data?.station || payload?.station || { code: rawCode, name: rawCode };

    let trainList = [];
    if (Array.isArray(payload?.data?.trains)) {
      trainList = payload.data.trains;
    } else if (Array.isArray(payload?.data)) {
      trainList = payload.data;
    } else if (Array.isArray(payload?.trains)) {
      trainList = payload.trains;
    } else if (Array.isArray(payload)) {
      trainList = payload;
    }

    if (!trainList.length) {
      console.warn(`[RailRadar API] No live departures found for ${rawCode}`);
      return [];
    }

    const uniqueMap = new Map();
    trainList.forEach((item) => {
      const normalized = normalizeStationTrain(item, rawStation);
      if (normalized.number && !uniqueMap.has(normalized.number)) {
        uniqueMap.set(normalized.number, normalized);
      }
    });

    return Array.from(uniqueMap.values());
  } catch (error) {
    console.error(`[RailRadar API Error] /stations/${rawCode}/live:`, error.response?.data || error.message);
    return [];
  }
}

// =====================================================
// PNR STATUS FETCHER
// =====================================================

function formatStatusDisplay(sub) {
  if (!sub) return null;
  if (sub.formatted) {
    return String(sub.formatted).toUpperCase().replace(/\//g, " · ");
  }
  if (sub.status) {
    return sub.berthNo ? `${String(sub.status).toUpperCase()} ${sub.berthNo}` : String(sub.status).toUpperCase();
  }
  return null;
}

function calculateChance(passenger, currentDisplay) {
  if (passenger.isCancelled) return { percent: 0, label: "Cancelled" };
  if (passenger.isConfirmed) return { percent: 100, label: "Confirmed" };
  if (passenger.isRAC) return { percent: 90, label: "Very High (RAC)" };

  const st = String(currentDisplay || "").toUpperCase();
  const match = st.match(/\d+/g);
  if (match) {
    const wlNum = parseInt(match[match.length - 1], 10);
    if (wlNum <= 10) return { percent: 85, label: "High" };
    if (wlNum <= 30) return { percent: 65, label: "Medium" };
    return { percent: 35, label: "Low" };
  }

  return { percent: 50, label: "Uncertain" };
}

function normalizePNR(payload) {
  if (!payload) return null;
  const rawData = payload.data || payload;
  const train = rawData.train || {};
  const charting = rawData.charting || {};
  const passengersRaw = rawData.passengers || [];

  const cleanClassCode = String(
    train.journeyClass || rawData.class || rawData.travelClass || "—"
  ).toUpperCase().trim();
  const classDisplayName = CLASS_NAMES[cleanClassCode] || cleanClassCode;

  const firstPax = passengersRaw[0] || {};
  const rawQuota =
    firstPax.current?.quota ||
    firstPax.booking?.quota ||
    rawData.quota ||
    "GN";
  const cleanQuotaCode = String(rawQuota).toUpperCase().trim();
  const quotaDisplayName = QUOTA_NAMES[cleanQuotaCode] || `${cleanQuotaCode} Quota`;

  const extractDate = () => {
    const d = train.journeyDate || train.journeyDateRaw || rawData.dateOfJourney || rawData.doj;
    if (!d) return "—";
    const dateObj = new Date(d);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return String(d);
  };

  const chartPrepared = Boolean(
    charting.isPrepared === true ||
    (String(charting.status || "").toUpperCase().includes("PREPARED") &&
      !String(charting.status || "").toUpperCase().includes("NOT"))
  );
  const chartStatus = charting.status || (chartPrepared ? "Chart Prepared" : "Chart Not Prepared");

  const passengers = (passengersRaw.length ? passengersRaw : [{}]).map((p, index) => {
    const bookingDisplay = formatStatusDisplay(p.booking) || "—";
    let currentDisplay;

    if (p.isCancelled) {
      currentDisplay = "CANCELLED";
    } else {
      currentDisplay = formatStatusDisplay(p.current) || bookingDisplay;
    }

    let berthStr;
    if (p.isCancelled) {
      berthStr = "Ticket Cancelled";
    } else if (p.isConfirmed) {
      berthStr =
        p.current?.coachId && p.current?.berthNo
          ? `${p.current.coachId} - ${p.current.berthNo}`
          : p.booking?.coachId && p.booking?.berthNo
          ? `${p.booking.coachId} - ${p.booking.berthNo}`
          : "Confirmed (Berth at Charting)";
    } else if (p.isRAC) {
      berthStr = "RAC (Side Lower Shared)";
    } else if (p.isWaitlisted) {
      berthStr = p.booking?.berthNo
        ? `Waitlisted · Booking Berth ${p.booking.berthNo} (${chartStatus})`
        : `Waitlisted (${chartStatus})`;
    } else {
      berthStr = "—";
    }

    return {
      passengerNumber: p.serialNumber || index + 1,
      name: p.name || `Passenger ${p.serialNumber || index + 1}`,
      age: p.age && p.age !== "0" && p.age !== "-" ? p.age : "—",
      gender: p.gender && p.gender !== "-" ? p.gender : "—",
      bookingStatus: bookingDisplay,
      currentStatus: currentDisplay,
      berth: berthStr,
      chance: calculateChance(p, currentDisplay),
    };
  });

  return {
    pnr: rawData.pnrNumber || rawData.pnr || "—",
    trainNumber: train.number || "—",
    trainName: train.name || "—",

    date: extractDate(),
    travelClass: classDisplayName,
    classCode: cleanClassCode,
    quota: quotaDisplayName,
    quotaCode: cleanQuotaCode,

    from: train.source?.name || train.boardingPoint?.name || "",
    fromCode: train.source?.code || train.boardingPoint?.code || "",

    to: train.destination?.name || train.reservationUpto?.name || "",
    toCode: train.destination?.code || train.reservationUpto?.code || "",

    chartPrepared,
    chartStatus,

    passengers,
  };
}

export async function fetchPNRStatus(pnrNumber) {
  if (!isLive) return null;

  try {
    const { data } = await client.get(`/pnr/${pnrNumber}`);
    if (!data?.success && !data?.data) return null;

    return normalizePNR(data.data || data);
  } catch (error) {
    console.error(`PNR fetch failed for ${pnrNumber}:`, error.response?.data || error.message);
    return null;
  }
}