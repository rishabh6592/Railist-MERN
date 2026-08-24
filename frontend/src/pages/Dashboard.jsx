import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  TrainFront,
  Clock3,
  Users,
  ArrowUpRight,
  Search,
  Bell,
  ChevronRight,
  Navigation,
  X,
  AlertCircle
} from "lucide-react";
import StatCard from "../components/StatCard";
import TrainCard from "../components/TrainCard";
import MapPanel from "../components/MapPanel";
import { getStationLive } from "../api";
import allStationsData from "../allStations.json";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stationTrains, setStationTrains] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected station state (Default Siwan Jn)
  const [selectedStation, setSelectedStation] = useState({
    code: "SV",
    name: "Siwan Jn",
  });
  const [stationQuery, setStationQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const dropdownRef = useRef(null);

  // Searchable Indian Stations Directory
  const stationsList = useMemo(() => {
    if (Array.isArray(allStationsData)) {
      return allStationsData.map((s) => ({
        code: (s.code || s.stationCode || "").toUpperCase().trim(),
        name: s.name || s.stationName || s.code,
        lat: Number(s.lat || s.latitude),
        lng: Number(s.lng || s.longitude || s.lon),
      }));
    }
    if (typeof allStationsData === "object" && allStationsData !== null) {
      return Object.entries(allStationsData).map(([code, item]) => ({
        code: code.toUpperCase().trim(),
        name: typeof item === "string" ? item : item.name || item.stationName || code,
        lat: Number(item.lat || item.latitude || (Array.isArray(item) ? item[0] : 0)),
        lng: Number(item.lng || item.longitude || (Array.isArray(item) ? item[1] : 0)),
      }));
    }
    return [];
  }, []);

  // Fetch Real Live Station Departures (UP & DOWN Next 6 Hours)
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function loadStationData() {
      const code = (selectedStation.code || "").toUpperCase().trim();
      if (!code) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const liveRows = await getStationLive(code, 6);
        if (mounted) {
          setStationTrains(Array.isArray(liveRows) ? liveRows : []);
          setLoading(false);
        }
      } catch (err) {
        console.error(`Error loading live departures for ${code}:`, err);
        if (mounted) {
          setStationTrains([]);
          setLoading(false);
        }
      }
    }

    loadStationData();

    return () => {
      mounted = false;
    };
  }, [selectedStation]);

  // Autocomplete Suggestions
  const stationSuggestions = useMemo(() => {
    const q = stationQuery.toLowerCase().trim();
    if (!q) return [];

    return stationsList
      .filter((s) => {
        const sName = String(s.name || "").toLowerCase();
        const sCode = String(s.code || "").toLowerCase();
        return sCode.startsWith(q) || sName.includes(q) || sCode.includes(q);
      })
      .slice(0, 8);
  }, [stationQuery, stationsList]);

  // Select Station
  const handleSelectStation = (st) => {
    const code = (st.code || "").toUpperCase().trim();
    const name = st.name || code;
    setSelectedStation({ code, name });
    setStationQuery("");
    setShowDropdown(false);
  };

  // Submit on Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = stationQuery.trim().toLowerCase();
    if (!q) return;

    const exactMatch = stationsList.find(
      (s) => (s.code || "").toLowerCase() === q || (s.name || "").toLowerCase() === q
    );

    if (exactMatch) {
      handleSelectStation(exactMatch);
    } else if (stationSuggestions.length > 0) {
      handleSelectStation(stationSuggestions[0]);
    } else {
      setSelectedStation({ code: q.toUpperCase(), name: q.toUpperCase() });
      setStationQuery("");
      setShowDropdown(false);
    }
  };

  // GPS Auto-detect Nearest Railway Station
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let closest = null;
        let minDistance = Infinity;

        stationsList.forEach((st) => {
          if (st.lat && st.lng && !isNaN(st.lat) && !isNaN(st.lng)) {
            const dist = Math.hypot(st.lat - latitude, st.lng - longitude);
            if (dist < minDistance) {
              minDistance = dist;
              closest = st;
            }
          }
        });

        if (closest) {
          handleSelectStation(closest);
        }
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
        alert("Location access denied or unavailable.");
      }
    );
  };

  // Dynamic Metrics Calculation from Live Departures
  const onTimeTrains = stationTrains.filter((t) => t.status !== "Delayed" && (!t.delay || t.delay <= 10));
  const onTimePct = stationTrains.length
    ? Math.round((onTimeTrains.length / stationTrains.length) * 100)
    : 100;
  const delayedTrains = stationTrains.filter((t) => t.status === "Delayed" || (t.delay && t.delay > 10));
  const avgDelay = delayedTrains.length
    ? Math.round(delayedTrains.reduce((acc, t) => acc + (Number(t.delay) || 0), 0) / delayedTrains.length)
    : 0;

  return (
    <div>
      {/* HERO SECTION */}
      <section className="hero">
        <div>
          <span className="eyebrow">
            <i></i> SYSTEMS ONLINE · LIVE NETWORK
          </span>
          <h1>
            Know your train.
            <br />
            <em>Own your journey.</em>
          </h1>
          <p>
            Live running status, platform changes, PNR intelligence and route alerts — all in one clean view.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary" onClick={() => navigate("/search")}>
            <Search size={17} /> Check train status
          </button>
          <button className="secondary" onClick={() => navigate("/pnr")}>
            PNR status
          </button>
        </div>
      </section>

      {/* METRIC STATS CARDS */}
      <div className="stats-grid">
        <StatCard
          icon={<Activity size={20} />}
          label="Departures (6 hrs)"
          value={loading ? "—" : String(stationTrains.length)}
          hint={`At ${selectedStation.code}`}
          tone="blue"
        />
        <StatCard
          icon={<TrainFront size={20} />}
          label="On-time performance"
          value={loading ? "—" : `${onTimePct}%`}
          hint="Across scheduled halts"
          tone="green"
        />
        <StatCard
          icon={<Clock3 size={20} />}
          label="Avg. delay"
          value={loading ? "—" : `${avgDelay} min`}
          hint="Among delayed trains"
          tone="orange"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Live network"
          value="Online"
          hint="Real-time IRCTC feed"
          tone="purple"
        />
      </div>

      <div className="section-head">
        <div>
          <span className="eyebrow">QUICK LOOK</span>
          <h2>Live network</h2>
        </div>
        <button className="text-btn" onClick={() => navigate("/search")}>
          See all trains <ArrowUpRight size={15} />
        </button>
      </div>

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid">
        <div className="panel" style={{ position: "relative" }}>
          {/* Header & Station Search */}
          <div
            className="panel-head"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              paddingBottom: "12px",
            }}
          >
            <div>
              <b style={{ fontSize: "15px", color: "var(--text-color, #1e293b)" }}>
                Next departures (UP & DOWN)
              </b>
              <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginTop: "2px" }}>
                {selectedStation.name} ({selectedStation.code}) · next 6 hours
              </span>
            </div>

            {/* High Contrast Visible Search Box */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              <form onSubmit={handleSearchSubmit} style={{ margin: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#0f172a",
                    border: "1.5px solid #2563eb",
                    borderRadius: 8,
                    padding: "6px 12px",
                    gap: 8,
                    width: "220px",
                  }}
                >
                  <Search size={15} style={{ color: "#60a5fa", flexShrink: 0 }} />
                  <input
                    type="text"
                    value={stationQuery}
                    placeholder="Search any station / code..."
                    onChange={(e) => {
                      setStationQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#ffffff",
                      width: "100%",
                    }}
                  />
                  {stationQuery && (
                    <X
                      size={14}
                      style={{ cursor: "pointer", color: "#94a3b8", flexShrink: 0 }}
                      onClick={() => {
                        setStationQuery("");
                        setShowDropdown(false);
                      }}
                    />
                  )}
                </div>
              </form>

              {/* GPS Button */}
              <button
                onClick={handleDetectGPS}
                title="Detect nearest station"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#2563eb",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "7px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                <Navigation size={13} />
                {detectingLocation ? "Locating..." : "Near Me"}
              </button>

              {/* Autocomplete Dropdown */}
              {showDropdown && stationSuggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    width: "250px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    marginTop: 6,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.5)",
                    zIndex: 300,
                    overflow: "hidden",
                    maxHeight: "260px",
                    overflowY: "auto",
                  }}
                >
                  {stationSuggestions.map((st) => (
                    <div
                      key={st.code}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectStation(st);
                      }}
                      style={{
                        padding: "10px 14px",
                        fontSize: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #1e293b",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "#f8fafc",
                        background: "#0f172a",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#0f172a")}
                    >
                      <span style={{ fontWeight: 600 }}>{st.name}</span>
                      <span
                        style={{
                          color: "#38bdf8",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: "rgba(56, 189, 248, 0.12)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {st.code}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TRAIN LIST / CLEAN REAL EMPTY STATE */}
          <div className="train-list" style={{ minHeight: "220px" }}>
            {loading ? (
              <div className="empty-state">Fetching live departures for {selectedStation.name}...</div>
            ) : stationTrains.length === 0 ? (
              <div
                className="empty-state"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 16px",
                  color: "#64748b",
                  textAlign: "center",
                }}
              >
                <AlertCircle size={36} style={{ color: "#f59e0b", marginBottom: "10px" }} />
                <b style={{ color: "var(--text-color, #1e293b)", fontSize: "15px" }}>
                  No departures in next 6 hours
                </b>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b", maxWidth: "340px" }}>
                  No UP/DOWN scheduled train halts found at{" "}
                  <strong style={{ color: "#2563eb" }}>
                    {selectedStation.name} ({selectedStation.code})
                  </strong>{" "}
                  for this time window.
                </p>
              </div>
            ) : (
              stationTrains.map((t) => (
                <TrainCard
                  key={t.number || `${t.fromCode}-${t.toCode}`}
                  train={t}
                  onClick={() => navigate(`/live/${t.number}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* MAP PANEL */}
        <MapPanel
          train={
            stationTrains[0] || {
              number: selectedStation.code,
              name: selectedStation.name,
              currentCode: selectedStation.code,
              currentLocation: selectedStation.name,
              stations: [
                {
                  code: selectedStation.code,
                  name: selectedStation.name,
                  scheduled: "—",
                  actual: "—",
                },
              ],
            }
          }
        />
      </div>

      {/* LOWER SECTION */}
      <div className="lower-grid">
        <div className="panel alert-panel">
          <div className="panel-head">
            <div>
              <b>
                <Bell size={16} /> Route alerts
              </b>
              <span>Important updates</span>
            </div>
            <button className="text-btn" onClick={() => navigate("/trips")}>
              View all
            </button>
          </div>
          <div className="alert-row">
            <span className="alert-icon danger">
              <Bell size={16} />
            </span>
            <div>
              <b>Network Advisory</b>
              <p>Check platform announcements at station concourse for last-minute bay changes.</p>
            </div>
            <small>Live</small>
          </div>
        </div>

        <div className="panel quick-panel">
          <div className="panel-head">
            <div>
              <b>Popular stations</b>
              <span>Quick select</span>
            </div>
          </div>
          <div className="chip-grid">
            {[
              { code: "SV", name: "Siwan Jn" },
              { code: "CPR", name: "Chhapra" },
              { code: "GKP", name: "Gorakhpur" },
              { code: "NDLS", name: "New Delhi" },
              { code: "PNBE", name: "Patna Jn" },
            ].map((st) => (
              <button key={st.code} onClick={() => handleSelectStation(st)}>
                {st.name} ({st.code}) <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}