import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, Home, Search, Radio, Ticket, Map, MessageSquare, Moon, Sun, Menu, X, TrainFront, Bookmark, Info } from "lucide-react";
import { getTrips } from "../storage";

const nav = [
  { to:"/", label:"Home", icon:Home },
  { to:"/search", label:"Search Trains", icon:Search },
  { to:"/live", label:"Live Status", icon:Radio },
  { to:"/pnr", label:"PNR Status", icon:Ticket },
  { to:"/stations", label:"Stations", icon:Map },
  { to:"/trips", label:"My Trips", icon:Bookmark },
  { to:"/feedback", label:"Feedback", icon:MessageSquare }
];

const NAME_KEY = "railist-username";
const APP_VERSION = "1.0.0";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function NameGateModal({ onSubmit }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "28px 26px",
          width: "100%",
          maxWidth: 360,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <TrainFront size={22} color="#4338ca" />
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
          Welcome to Railist
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>
          What should we call you?
        </p>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your name"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 15,
            fontWeight: 600,
            color: "#1e293b",
            outline: "none",
            marginBottom: 16,
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          style={{
            width: "100%",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "11px 0",
            fontWeight: 700,
            fontSize: 14,
            cursor: value.trim() ? "pointer" : "not-allowed",
            opacity: value.trim() ? 1 : 0.6,
          }}
        >
          Continue
        </button>
      </form>
    </div>
  );
}

export default function Layout({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem("railist-theme") === "dark");
  const [open, setOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(() => getTrips().length);
  const [userName, setUserName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("railist-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => setOpen(false), [location.pathname]);

  // Trips (and their alerts) can change on other pages — re-read on every route change.
  useEffect(() => setAlertCount(getTrips().length), [location.pathname]);

  const handleNameSubmit = (name) => {
    localStorage.setItem(NAME_KEY, name);
    setUserName(name);
  };

  return (
    <div className="app-shell">
      {!userName && <NameGateModal onSubmit={handleNameSubmit} />}

      <aside className={`sidebar ${open ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><TrainFront size={22}/></div>
          <div className="brand-text">
            <strong>Railist</strong>
            <span className="version-badge">V-{APP_VERSION}</span>
          </div>
          <button className="icon-btn mobile-close" onClick={() => setOpen(false)}><X size={18}/></button>
        </div>

        <div className="nav-label">MAIN MENU</div>
        <nav>{nav.map(({to,label,icon:Icon}) =>
          <NavLink key={to} to={to} className={({isActive}) => `nav-item ${isActive ? "active":""}`}>
            <Icon size={18}/><span>{label}</span>
          </NavLink>
        )}</nav>

        <div className="sidebar-bottom">
          <div className="mini-alert" onClick={() => navigate("/trips")} style={{cursor:"pointer"}}>
            <Bell size={17}/>
            <div><b>Live alerts</b><span>{alertCount ? `${alertCount} train${alertCount>1?"s":""} tracked` : "No trains tracked yet"}</span></div>
            {alertCount > 0 && <i>{alertCount}</i>}
          </div>
          <button className="nav-item" onClick={() => setDark(v => !v)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}<span>{dark ? "Light mode" : "Dark mode"}</span></button>
        </div>
      </aside>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setOpen(true)}><Menu size={20}/></button>
          <div className="crumb"><span>Railist</span><b>/</b><strong>{location.pathname === "/" ? "Overview" : location.pathname.slice(1).replaceAll("/", " · ")}</strong></div>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => navigate("/trips")}><Bell size={19}/>{alertCount > 0 && <em>{alertCount}</em>}</button>
            <div className="avatar" title={userName || undefined}>{getInitials(userName)}</div>
          </div>
        </header>
        <main className="content">{children}</main>
        <footer style={{ textAlign: "center", padding: "16px", fontSize: 13, color: "#94a3b8" }}>
          <p style={{ margin: "2px 0" }}>© {new Date().getFullYear()} Railist. All rights reserved.</p>
          <p style={{ margin: "2px 0" }}>Built with ❤️ by Rishabh</p>
        </footer>
      </div>
    </div>
  );
}