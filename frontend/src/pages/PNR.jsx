import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrainFront,
  Copy,
  RefreshCcw,
  Users,
} from "lucide-react";
import { getPNR } from "../api";

function getStatusType(currentStr) {
  const s = String(currentStr || "").toUpperCase();
  if (s.includes("CNF") || s.includes("CONFIRM")) return "CNF";
  if (s.includes("RAC")) return "RAC";
  if (s.includes("WL") || s.includes("W/L") || s.includes("WAIT")) return "WL";
  if (s.includes("CAN")) return "CAN";
  return "OTHER";
}

const STATUS_COLORS = {
  CNF: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  RAC: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  WL: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  CAN: { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" },
  OTHER: { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
};

const chanceColor = (percent) =>
  percent >= 80 ? "#16a34a" : percent >= 50 ? "#d97706" : "#dc2626";

export default function PNR() {
  const [pnrInput, setPnrInput] = useState("");
  const [pnrData, setPnrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchPNR = async (pnrValue) => {
    try {
      setLoading(true);
      setError("");
      const res = await getPNR(pnrValue);
      const data = res?.data || res;

      if (!data || (!data.pnr && !data.trainNumber)) {
        throw new Error("PNR details not found or expired.");
      }
      setPnrData(data);
    } catch (err) {
      setError(err.message || "Failed to fetch PNR status.");
      setPnrData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    const trimmed = pnrInput.trim();
    if (!trimmed || trimmed.length !== 10) {
      setError("Please enter a valid 10-digit PNR number.");
      return;
    }
    fetchPNR(trimmed);
  };

  const handleRefresh = () => {
    if (pnrData?.pnr) fetchPNR(pnrData.pnr);
  };

  const handleCopy = async () => {
    if (!pnrData?.pnr) return;
    try {
      await navigator.clipboard.writeText(pnrData.pnr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available, ignore
    }
  };

  const passengers = pnrData?.passengers || [];
  const statusCounts = passengers.reduce(
    (acc, p) => {
      const type = getStatusType(p.currentStatus);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    { CNF: 0, RAC: 0, WL: 0, CAN: 0, OTHER: 0 }
  );

  const summaryParts = [];
  if (statusCounts.CNF) summaryParts.push(`${statusCounts.CNF} Confirmed`);
  if (statusCounts.RAC) summaryParts.push(`${statusCounts.RAC} RAC`);
  if (statusCounts.WL) summaryParts.push(`${statusCounts.WL} Waitlisted`);
  if (statusCounts.CAN) summaryParts.push(`${statusCounts.CAN} Cancelled`);
  if (statusCounts.OTHER) summaryParts.push(`${statusCounts.OTHER} Other`);

  return (
    <div className="pnr-page" style={{ maxWidth: 1050, margin: "0 auto", padding: "24px 16px" }}>
      <style>{`
        .pnr-page { box-sizing: border-box; }
        .pnr-page *, .pnr-page *::before, .pnr-page *::after { box-sizing: border-box; }

        .pnr-mobile-passengers { display: none; }

        @media (max-width: 720px) {
          .pnr-page { padding: 16px 12px !important; }
          .pnr-search-form { flex-direction: column !important; align-items: stretch !important; padding: 14px !important; }
          .pnr-search-form button { width: 100%; justify-content: center; }
          .pnr-header-row { flex-direction: column !important; align-items: flex-start !important; }
          .pnr-header-actions { width: 100%; justify-content: space-between !important; }
          .pnr-meta-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; }
          .pnr-table-wrap { display: none !important; }
          .pnr-mobile-passengers { display: block !important; }
        }

        @media (max-width: 420px) {
          .pnr-meta-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Title Header */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "1px" }}>
          RESERVATION INTELLIGENCE
        </span>
        <h1 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "#575757", margin: "4px 0" }}>
          PNR status
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Check live waitlist type, confirmation probability, RAC and berth allocation.
        </p>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={handleSearch}
        className="pnr-search-form"
        style={{
          background: "#fff",
          padding: "16px 20px",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <Search size={20} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={pnrInput}
            onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 10 digit PNR (e.g. 6948414872)"
            style={{
              border: "none",
              outline: "none",
              fontSize: 16,
              fontWeight: 600,
              width: "100%",
              minWidth: 0,
              color: "#1e293b",
              background: "transparent",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 24px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {loading ? "Checking..." : "Check status"}
        </button>
      </form>

      {error && (
        <div style={{ padding: 14, background: "#fee2e2", color: "#dc2626", borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !pnrData && (
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            border: "1px solid #e2e8f0",
            padding: 40,
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          Fetching PNR details…
        </div>
      )}

      {/* PNR Details Card */}
      {pnrData && (
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="pnr-header-row"
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>PNR NUMBER</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "clamp(19px, 5vw, 24px)", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                  {pnrData.pnr || pnrInput}
                </h2>
                <button
                  onClick={handleCopy}
                  title="Copy PNR"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: copied ? "#16a34a" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Copy size={15} />
                </button>
                {copied && <span style={{ fontSize: 11, color: "#16a34a" }}>Copied!</span>}
              </div>
              <p style={{ fontSize: 13, color: "#475569", margin: 0, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <TrainFront size={14} style={{ flexShrink: 0 }} />
                <b>{pnrData.trainNumber || "—"}</b> — {pnrData.trainName || "—"}
              </p>
            </div>

            <div className="pnr-header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh status"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 20,
                  background: "#eef2ff",
                  color: "#4338ca",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <RefreshCcw size={13} className={loading ? "spin" : ""} />
                Refresh
              </button>

              {/* Chart Status Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: pnrData.chartPrepared ? "#ecfdf5" : "#fef3c7",
                  color: pnrData.chartPrepared ? "#059669" : "#d97706",
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {pnrData.chartPrepared ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {pnrData.chartStatus}
              </div>
            </div>
          </div>

          {/* Journey Meta */}
          <div
            className="pnr-meta-grid"
            style={{
              padding: "16px 24px",
              background: "#f8fafc",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>JOURNEY DATE</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "3px 0 0" }}>
                {pnrData.date && pnrData.date !== "—" ? pnrData.date : "—"}
              </p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>FROM</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "3px 0 0" }}>
                {pnrData.fromCode || pnrData.from} {pnrData.from && pnrData.fromCode !== pnrData.from ? `(${pnrData.from})` : ""}
              </p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>TO</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "3px 0 0" }}>
                {pnrData.toCode || pnrData.to} {pnrData.to && pnrData.toCode !== pnrData.to ? `(${pnrData.to})` : ""}
              </p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>CLASS & QUOTA</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "3px 0 0" }}>
                <b>{pnrData.travelClass}</b> · {pnrData.quota}
              </p>
            </div>
          </div>

          {/* Passenger Summary Strip */}
          {passengers.length > 0 && (
            <div
              style={{
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid #f1f5f9",
                fontSize: 13,
                color: "#475569",
                flexWrap: "wrap",
              }}
            >
              <Users size={15} color="#64748b" style={{ flexShrink: 0 }} />
              <span>
                <b>{passengers.length}</b> passenger{passengers.length > 1 ? "s" : ""} ·{" "}
                {summaryParts.join(" · ") || "Status unavailable"}
              </span>
            </div>
          )}

          {/* Passenger Details — Table (desktop) */}
          <div className="pnr-table-wrap" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
                  <th style={{ padding: "14px 20px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>#</th>
                  <th style={{ padding: "14px 20px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>PASSENGER</th>
                  <th style={{ padding: "14px 20px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>BOOKING STATUS</th>
                  <th style={{ padding: "14px 20px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>CURRENT STATUS</th>
                  <th style={{ padding: "14px 20px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>CONFIRMATION CHANCE</th>
                  <th style={{ padding: "14px 20px", fontSize: 11, color: "#64748b", fontWeight: 700 }}>BERTH / SEAT STATUS</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, idx) => {
                  const type = getStatusType(p.currentStatus);
                  const colors = STATUS_COLORS[type];

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b" }}>
                        {p.passengerNumber || idx + 1}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                          {p.name || `Passenger ${idx + 1}`}
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          Age: {p.age} · Gender: {p.gender}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 700, color: "#475569" }}>
                        {p.bookingStatus || "—"}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.5px",
                            background: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.currentStatus || "—"}
                        </span>
                      </td>

                      {/* Confirmation Chance Badge */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <TrendingUp size={16} color={chanceColor(p.chance?.percent)} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: chanceColor(p.chance?.percent), whiteSpace: "nowrap" }}>
                            {p.chance?.percent}% ({p.chance?.label})
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        {p.berth || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Passenger Details — Cards (mobile) */}
          <div className="pnr-mobile-passengers">
            {passengers.map((p, idx) => {
              const type = getStatusType(p.currentStatus);
              const colors = STATUS_COLORS[type];

              return (
                <div
                  key={idx}
                  style={{
                    padding: "16px 18px",
                    borderBottom: idx < passengers.length - 1 ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                        #{p.passengerNumber || idx + 1} · {p.name || `Passenger ${idx + 1}`}
                      </div>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        Age: {p.age} · Gender: {p.gender}
                      </span>
                    </div>
                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        background: colors.bg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {p.currentStatus || "—"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5 }}>
                    <div>
                      <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 10.5 }}>BOOKING STATUS</span>
                      <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#475569" }}>{p.bookingStatus || "—"}</p>
                    </div>
                    <div>
                      <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 10.5 }}>CONFIRMATION CHANCE</span>
                      <p style={{ margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4, fontWeight: 700, color: chanceColor(p.chance?.percent) }}>
                        <TrendingUp size={13} />
                        {p.chance?.percent}% ({p.chance?.label})
                      </p>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 10.5 }}>BERTH / SEAT STATUS</span>
                      <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#0f172a" }}>{p.berth || "—"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}