import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Bell,
  BellRing,
  Share2,
  Star,
  Gauge,
  MapPin,
  Clock3,
  Copy,
  Calendar,
  CheckCircle2,
} from "lucide-react";

import { getTrain } from "../api";
import MapPanel from "../components/MapPanel";
import { isTripSaved, toggleTrip } from "../storage";

/* =========================================================
   HELPER: TIME & DELAY FORMATTER (120 min -> 2 hr)
   ========================================================= */

function formatDelay(minutes) {
  if (minutes === undefined || minutes === null || isNaN(minutes) || Number(minutes) === 0) {
    return "On time";
  }

  const mins = Math.abs(parseInt(minutes, 10));
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  let formatted = "";
  if (hrs > 0 && remainingMins > 0) {
    formatted = `${hrs} hr ${remainingMins} min`;
  } else if (hrs > 0) {
    formatted = `${hrs} hr`;
  } else {
    formatted = `${remainingMins} min`;
  }

  return Number(minutes) < 0 ? `Early by ${formatted}` : formatted;
}

/* =========================================================
   COACH COMPOSITION
   ========================================================= */

function buildCoaches(number, name) {
  const trainName = String(name || "");
  const isRajdhani = /rajdhani/i.test(trainName);
  const isShatabdi = /shatabdi/i.test(trainName);
  const seed = Number(String(number || "").slice(-2)) || 5;

  const coaches = ["EOG"];

  if (isRajdhani) {
    coaches.push("H1", "A1", "A2", "A3", "B1", "B2", "B3", "B4", "B5", "PC");
  } else if (isShatabdi) {
    coaches.push("EC", "C1", "C2", "C3", "C4", "C5", "C6", "C7");
  } else {
    const sleepers = 3 + (seed % 5);
    coaches.push("B1", "B2");
    for (let i = 1; i <= sleepers; i++) {
      coaches.push(`S${i}`);
    }
    coaches.push("GEN1", "GEN2");
  }

  coaches.push("EOG");
  return coaches;
}

/* =========================================================
   DATE HELPERS — Today, Yesterday, and 2 more days back
   ========================================================= */

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function buildDateOptions() {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    options.push({
      value: isoDate(d),
      label:
        i === 0 ? "Today" :
        i === 1 ? "Yesterday" :
        d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    });
  }
  return options;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function TrainDetails() {
  const { number } = useParams();
  const navigate = useNavigate();

  const dateOptions = useMemo(buildDateOptions, []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const isToday = selectedDate === dateOptions[0].value;

  const [train, setTrain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("route");

  const [saved, setSaved] = useState(() => isTripSaved(number));
  const [alertOn, setAlertOn] = useState(() => isTripSaved(number));
  const [copyMsg, setCopyMsg] = useState("");

  /* =======================================================
     FETCH LIVE / HISTORICAL DATA
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchTrain = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getTrain(number, selectedDate);
        const data = res?.data || res;

        if (!mounted) return;

        if (!data) {
          throw new Error("Train data nahi mila.");
        }

        setTrain(data);
      } catch (err) {
        console.error("❌ Train data error:", err);
        if (mounted) {
          setError("Train data load nahi ho pa raha.");
          setTrain(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTrain();

    const interval = isToday ? setInterval(fetchTrain, 30 * 1000) : null;

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [number, selectedDate, isToday]);

  useEffect(() => {
    setSaved(isTripSaved(number));
    setAlertOn(isTripSaved(number));
    setTab("route");
  }, [number]);

  /* =======================================================
     ROUTE STATIONS
     ======================================================= */

  const routeStations = useMemo(() => {
    const rawStations = Array.isArray(train?.stations)
      ? train.stations
      : Array.isArray(train?.route)
      ? train.route
      : [];

    if (!rawStations.length) return [];

    return rawStations.filter((st, index, arr) => {
      if (index === 0 || index === arr.length - 1) return true;
      if (st.is_halt === false || st.isHalt === false || st.isCommercialStop === false) {
        return false;
      }
      return true;
    });
  }, [train]);

  /* =======================================================
     COACHES
     ======================================================= */

  const coaches = useMemo(() => {
    if (!train) return [];
    if (Array.isArray(train.coaches)) {
      return train.coaches
        .map((coach) => (typeof coach === "string" ? coach : coach.code || coach.name || null))
        .filter(Boolean);
    }
    return buildCoaches(train.number, train.name);
  }, [train]);

  /* =======================================================
     JOURNEY STATUS & LOCATION RESOLUTION (PAST DATES FIX)
     ======================================================= */

  const lastStation = routeStations.length > 0 ? routeStations[routeStations.length - 1] : null;
  
  // Agar date past ki hai ya destination cross ho chuka hai
  const isCompleted = useMemo(() => {
    if (!isToday) return true;
    const rawStatus = String(train?.status || train?.runningStatus || "").toLowerCase();
    return rawStatus.includes("reached") || rawStatus.includes("completed") || rawStatus.includes("arrived") || lastStation?.hasPassed;
  }, [isToday, train, lastStation]);

  // Destination and delay calculations
  const destName = train?.to || train?.destStationName || lastStation?.name || lastStation?.stationName || "Destination";
  const destCode = train?.toCode || train?.destStationCode || lastStation?.code || lastStation?.stationCode || "—";
  
  const finalDelay = Number(
    lastStation?.delay ??
    lastStation?.delayMinutes ??
    train?.delay ??
    train?.delayMinutes ??
    train?.current_delay ??
    0
  );

  const delay = isCompleted ? finalDelay : Number(train?.delay ?? train?.delayMinutes ?? train?.current_delay ?? 0);

  const currentLocation = isCompleted
    ? destName
    : train?.currentLocation?.stationName ||
      train?.currentLocation?.name ||
      train?.currentLocation ||
      train?.currentStation ||
      "En route";

  const currentCode = isCompleted
    ? destCode
    : train?.currentLocation?.stationCode ||
      train?.currentLocation?.code ||
      train?.currentCode ||
      train?.currentStationCode ||
      "—";

  const nextStop = isCompleted
    ? "Journey Completed"
    : train?.nextStation?.name ||
      train?.nextStation?.stationName ||
      train?.nextStop ||
      "—";

  const speed = Number(
    train?.currentLocation?.speed ??
    train?.currentLocation?.speedKmh ??
    train?.speed ??
    train?.currentSpeed ??
    train?.cur_speed ??
    0
  );

  const selectedLabel = dateOptions.find((d) => d.value === selectedDate)?.label;

  /* =======================================================
     ACTIONS
     ======================================================= */

  const toggleStar = () => {
    if (!train) return;
    const nowSaved = toggleTrip(train);
    setSaved(nowSaved);
    setAlertOn(nowSaved);
  };

  const setAlert = () => {
    if (!train) return;
    if (!saved) {
      toggleTrip(train);
      setSaved(true);
    }
    setAlertOn((value) => !value);
  };

  const share = async () => {
    if (!train) return;
    const url = `${window.location.origin}/live/${train.number || number}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${train.number} · ${train.name}`,
          url,
        });
        return;
      } catch {
        // cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopyMsg("Link copied");
    } catch {
      setCopyMsg(url);
    }

    setTimeout(() => {
      setCopyMsg("");
    }, 2500);
  };

  if (loading && !train) {
    return <div className="empty-state">Loading train data...</div>;
  }

  if (error && !train) {
    return (
      <div>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="date-tabs">
          <Calendar size={15} />
          {dateOptions.map((d) => (
            <button
              key={d.value}
              className={selectedDate === d.value ? "active" : ""}
              onClick={() => setSelectedDate(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="empty-state" style={{ marginTop: 30, textAlign: "center" }}>
          <h3>Data unavailable</h3>
          <p>{error}</p>
          <button className="primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!train) return null;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* HERO SECTION */}
      <div className="detail-hero">
        <div>
          <span className={`status ${isCompleted ? "success" : isToday ? "live" : delay > 15 ? "danger" : ""}`}>
            {loading
              ? "Updating..."
              : isCompleted
              ? `Completed · Reached ${destCode} (${selectedLabel})`
              : `${train.status || "Running"} · ${selectedLabel}`}
          </span>

          <h1>{train.number || number} · {train.name}</h1>

          <p>
            {train.fromCode || train.sourceStationCode || ""} {train.from || train.sourceStationName || ""}{" "}
            <b>→</b> {train.toCode || train.destStationCode || ""} {train.to || train.destStationName || ""}
          </p>
        </div>

        <div className="detail-actions" style={{ position: "relative" }}>
          <button className="icon-btn" onClick={toggleStar} title="Save">
            <Star size={18} fill={saved ? "currentColor" : "none"} />
          </button>

          <button className="icon-btn" onClick={share} title="Share">
            <Share2 size={18} />
          </button>

          <button className="primary" onClick={setAlert}>
            {alertOn ? <BellRing size={16} /> : <Bell size={16} />}
            {alertOn ? "Alert set" : "Set alert"}
          </button>

          {copyMsg && (
            <span
              className="pill"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 6,
                display: "flex",
                gap: 5,
                alignItems: "center",
              }}
            >
              <Copy size={11} /> {copyMsg}
            </span>
          )}
        </div>
      </div>

      {/* DATE SELECTOR */}
      <div className="date-tabs">
        <Calendar size={15} />
        {dateOptions.map((d) => (
          <button
            key={d.value}
            className={selectedDate === d.value ? "active" : ""}
            onClick={() => setSelectedDate(d.value)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* LIVE GRID */}
      <div className="live-grid">
        <div className="panel live-main">
          {/* TOP DELAY CARD */}
          <div className="delay-banner">
            <div>
              <span>{isCompleted ? "Final Arrival Delay" : isToday ? "Current delay" : "Delay"}</span>
              <strong>{formatDelay(delay)}</strong>
              <small>{loading ? "Updating..." : isCompleted ? `Completed on ${selectedLabel}` : isToday ? "Live telemetry" : `Status for ${selectedLabel}`}</small>
            </div>

            <div className="delay-route">
              <b>{train.fromCode || train.sourceStationCode || "—"}</b>
              <i></i><span>●</span><i></i>
              <b>{train.toCode || train.destStationCode || "—"}</b>
            </div>
          </div>

          {/* TELEMETRY METRIC CARDS */}
          <div className="live-cards">
            <div>
              <MapPin size={18} />
              <span>{isCompleted ? "Final Destination" : isToday ? "Current location" : "Last known location"}</span>
              <b>{typeof currentLocation === "string" ? currentLocation : "In Transit"}</b>
              <small>{currentCode}</small>
            </div>

            <div>
              <Clock3 size={18} />
              <span>{isCompleted ? "Journey Status" : "Next stop"}</span>
              <b>{typeof nextStop === "string" ? nextStop : "—"}</b>
              <small>{isCompleted ? "All stops covered" : delay > 0 ? `Delay +${formatDelay(delay)}` : "On schedule"}</small>
            </div>

            <div>
              <Gauge size={18} />
              <span>Current speed</span>
              <b>{!isCompleted && isToday ? (speed > 0 ? `${speed} km/h` : "0 km/h") : "—"}</b>
              <small>{isCompleted ? "Arrived at destination" : isToday ? (speed > 0 ? "Live telemetry" : "Station halt / Waiting") : "Not tracked for past dates"}</small>
            </div>
          </div>

          {/* TABS */}
          <div className="tabs">
            <span className={tab === "route" ? "active" : ""} onClick={() => setTab("route")}>
              Route
            </span>
            <span className={tab === "map" ? "active" : ""} onClick={() => setTab("map")}>
              Live Map
            </span>
            <span className={tab === "coach" ? "active" : ""} onClick={() => setTab("coach")}>
              Coach Position
            </span>
            <span className={tab === "info" ? "active" : ""} onClick={() => setTab("info")}>
              Info
            </span>
          </div>

          {/* ROUTE TIMELINE */}
          {tab === "route" && (
            <div className="timeline">
              {routeStations.length ? (
                routeStations.map((station, index) => {
                  const stationDelay = Number(station.delay ?? station.delayMinutes ?? station.delayArrival ?? 0);
                  const stName = station.name || station.stationName || "Station";
                  const stCode = station.code || station.stationCode || "";
                  const schTime = station.scheduled || station.schedule || station.sch_arr || station.arrival || station.sch_dep || "—";
                  const actTime = station.actual || station.act_arr || station.act_dep || "—";
                  
                  // Past date me sab passed ho chuka hai
                  const isPassed = isCompleted || station.hasPassed || station.status === "Departed" || station.status === "departed";
                  const isCurrent = !isCompleted && isToday && (station.status === "Current" || stCode === currentCode);

                  return (
                    <div
                      className={`timeline-row ${isCurrent ? "current" : isPassed ? "passed" : ""}`}
                      key={`${stCode || stName}-${index}`}
                    >
                      <div className="time">{schTime}</div>

                      <div className="dot-col">
                        <i style={{ background: isCurrent ? "#2563eb" : isPassed ? "#10b981" : "#cbd5e1" }}></i>
                      </div>

                      <div className="station">
                        <b>
                          {stName} {stCode && <small>({stCode})</small>}
                        </b>

                        <span>
                          Sch. {schTime} · Actual {actTime !== "-" && actTime !== "_" ? actTime : "—"}
                        </span>
                      </div>

                      <strong style={{ color: stationDelay > 0 ? "#ef4444" : "#10b981" }}>
                        {stationDelay > 0 ? `+${formatDelay(stationDelay)}` : "On time"}
                      </strong>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">Route data not available from API.</div>
              )}
            </div>
          )}

          {/* MAP TAB */}
          {tab === "map" && (
            <div style={{ padding: 14 }}>
              <MapPanel train={{ ...train, isCompleted }} />
            </div>
          )}

          {/* COACH TAB */}
          {tab === "coach" && (
            <div className="timeline" style={{ padding: "18px 14px" }}>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 14px" }}>
                Coach order for {train.number || number} — platform {train.platform || "—"}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {coaches.map((coach, index) => (
                  <span
                    key={`${coach}-${index}`}
                    className="seat"
                    style={{
                      background:
                        coach === "EOG"
                          ? "var(--red2)"
                          : coach.startsWith("A") || coach === "EC"
                          ? "var(--blue2)"
                          : coach.startsWith("H")
                          ? "var(--purple)"
                          : "var(--green2)",
                      color:
                        coach === "EOG"
                          ? "var(--red)"
                          : coach.startsWith("A") || coach === "EC"
                          ? "var(--blue)"
                          : coach.startsWith("H")
                          ? "#fff"
                          : "var(--green)",
                      padding: "8px 12px",
                      fontSize: 10,
                    }}
                  >
                    {coach}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* INFO TAB */}
          {tab === "info" && (
            <div className="timeline" style={{ padding: "18px 14px", display: "grid", gap: 14 }}>
              <div className="live-cards" style={{ padding: 0, gridTemplateColumns: "repeat(2,1fr)" }}>
                <div>
                  <span>Running status</span>
                  <b>{isCompleted ? "Reached Destination" : status}</b>
                </div>
                <div>
                  <span>Platform</span>
                  <b>{train.platform || "Not assigned"}</b>
                </div>
                <div>
                  <span>Total stops</span>
                  <b>{routeStations.length || "—"}</b>
                </div>
                <div>
                  <span>{isCompleted ? "Final Delay" : isToday ? "Current Delay" : "Delay"}</span>
                  <b>{formatDelay(delay)}</b>
                </div>
              </div>
            </div>
          )}
        </div>

        <MapPanel train={{ ...train, isCompleted }} />
      </div>
    </div>
  );
}