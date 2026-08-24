import React, { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import allStationsData from "../allStations.json";

// Fast lookup map for all Indian railway station coordinates
const stationCoordsMap = new Map();
if (Array.isArray(allStationsData)) {
  allStationsData.forEach((st) => {
    const code = (st.code || st.stationCode || "").toUpperCase().trim();
    const lat = Number(st.lat || st.latitude || st.lat_deg);
    const lng = Number(st.lng || st.lon || st.longitude || st.lng_deg);
    if (code && !isNaN(lat) && !isNaN(lng)) {
      stationCoordsMap.set(code, [lat, lng]);
    }
  });
} else if (typeof allStationsData === "object" && allStationsData !== null) {
  Object.entries(allStationsData).forEach(([code, data]) => {
    const lat = Number(data.lat || data.latitude || (Array.isArray(data) ? data[0] : null));
    const lng = Number(data.lng || data.lon || data.longitude || (Array.isArray(data) ? data[1] : null));
    if (!isNaN(lat) && !isNaN(lng)) {
      stationCoordsMap.set(code.toUpperCase().trim(), [lat, lng]);
    }
  });
}

// Auto-Fit map view to the current train route
function AutoFitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
    }
  }, [coords, map]);
  return null;
}

// Custom Marker Icons
const createDotIcon = (isPassed, isTerminus) =>
  L.divIcon({
    className: "station-dot",
    html: `<div style="background:${isPassed ? "#2563eb" : "#94a3b8"}; width:${isTerminus ? 10 : 7}px; height:${isTerminus ? 10 : 7}px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

const createLiveTrainIcon = (isCompleted) =>
  L.divIcon({
    className: "live-train-marker",
    html: `
      <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${isCompleted ? '#10b981' : '#ef4444'}; opacity:0.35; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="width:16px; height:16px; border-radius:50%; background:${isCompleted ? '#10b981' : '#ef4444'}; border:2px solid #ffffff; z-index:2; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.5);">
          <span style="font-size:9px; color:#ffffff;">🚆</span>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

export default function MapPanel({ train }) {
  if (!train) return null;

  const rawStations = Array.isArray(train.stations)
    ? train.stations
    : Array.isArray(train.route)
    ? train.route
    : [];

  const isCompleted = Boolean(
    train.isCompleted ||
    String(train.status || "").toLowerCase().includes("reached") ||
    String(train.status || "").toLowerCase().includes("completed")
  );

  // Map every station of the searched train to its exact lat/lng
  const mappedStations = useMemo(() => {
    return rawStations
      .map((st, idx) => {
        const code = String(st.code || st.stationCode || "").toUpperCase().trim();
        const lat = Number(st.lat || st.latitude);
        const lng = Number(st.lng || st.lon || st.longitude);

        const coords = (!isNaN(lat) && !isNaN(lng) && lat !== 0)
          ? [lat, lng]
          : stationCoordsMap.get(code) || null;

        return {
          ...st,
          code,
          name: st.name || st.stationName || code,
          coords,
          index: idx,
        };
      })
      .filter((st) => st.coords && st.coords.length === 2);
  }, [rawStations]);

  if (!mappedStations.length) {
    return (
      <div style={{ background: "#0f172a", borderRadius: 12, padding: 18, color: "#94a3b8", textAlign: "center", border: "1px solid #1e293b" }}>
        Route coordinates not available for this train.
      </div>
    );
  }

  // Calculate live/completed position index
  let matchedIdx = mappedStations.findIndex(
    (s) =>
      s.code === train.currentCode ||
      s.code === train.currentStationCode ||
      s.name.toLowerCase() === String(train.currentLocation || "").toLowerCase()
  );

  const activeIndex = isCompleted
    ? mappedStations.length - 1
    : matchedIdx >= 0
    ? matchedIdx
    : 0;

  const activeStation = mappedStations[activeIndex];

  const allCoords = mappedStations.map((s) => s.coords);
  const coveredCoords = mappedStations.slice(0, activeIndex + 1).map((s) => s.coords);

  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "14px",
        overflow: "hidden",
        width: "100%",
        height: "360px",
        position: "relative",
      }}
    >
      {/* Top Floating Train Info */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(6px)",
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid #334155",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: isCompleted ? "#10b981" : "#38bdf8", fontSize: 12, fontWeight: 600 }}>
          ● {isCompleted ? "Journey Completed" : "Live Route Map"}
        </span>
        <span style={{ color: "#cbd5e1", fontSize: 11 }}>
          {train.number} · {train.fromCode || mappedStations[0]?.code} → {train.toCode || mappedStations[mappedStations.length - 1]?.code}
        </span>
      </div>

      <MapContainer
        center={activeStation?.coords || allCoords[0]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <AutoFitBounds coords={allCoords} />

        {/* Crisp Map Tiles with City Labels */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Full Route Line */}
        <Polyline positions={allCoords} color="#94a3b8" weight={3.5} opacity={0.65} dashArray="5, 8" />

        {/* Covered Path Line */}
        {coveredCoords.length > 1 && (
          <Polyline positions={coveredCoords} color="#2563eb" weight={4.5} opacity={0.9} />
        )}

        {/* All Stations & Cities along the route */}
        {mappedStations.map((st, idx) => {
          const isPassed = isCompleted || idx <= activeIndex;
          const isTerminus = idx === 0 || idx === mappedStations.length - 1;

          return (
            <Marker
              key={`${st.code}-${idx}`}
              position={st.coords}
              icon={createDotIcon(isPassed, isTerminus)}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>
                  {st.name} ({st.code})
                </span>
              </Tooltip>
              <Popup>
                <div style={{ fontSize: 12, color: "#0f172a" }}>
                  <b style={{ fontSize: 13 }}>{st.name} ({st.code})</b>
                  <div style={{ marginTop: 4 }}>Scheduled: {st.scheduled || "—"}</div>
                  <div>Actual: {st.actual || "—"}</div>
                  <div style={{ color: st.delay > 0 ? "#ef4444" : "#10b981", fontWeight: 600, marginTop: 2 }}>
                    {st.delay > 0 ? `+${st.delay} min delay` : "On Time"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Current / Destination Train Live Marker */}
        {activeStation && (
          <Marker position={activeStation.coords} icon={createLiveTrainIcon(isCompleted)} zIndexOffset={1000}>
            <Tooltip permanent direction="bottom" offset={[0, 10]} opacity={0.95}>
              <span style={{ fontSize: 10, fontWeight: 700, color: isCompleted ? "#065f46" : "#991b1b" }}>
                {isCompleted ? `Arrived: ${activeStation.name}` : `Near: ${activeStation.name}`}
              </span>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}