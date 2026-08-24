import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrainFront, History, X } from "lucide-react";
import { trains as localTrains } from "../data";
import { getRecentTrainSearches, addRecentTrainSearch, clearRecentTrainSearches } from "../storage";

export default function LiveStatus() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState(getRecentTrainSearches());

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return localTrains.filter(t =>
      t.number.toLowerCase().includes(query) ||
      (t.name || "").toLowerCase().includes(query)
    ).slice(0, 10);
  }, [q]);

  const openTrain = (train) => {
    addRecentTrainSearch({ number: train.number, name: train.name });
    setRecent(getRecentTrainSearches());
    navigate(`/live/${train.number}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;

    // Priority: exact train number match > exact name match > first partial result > raw query
    const exactNumber = localTrains.find(t => t.number.toLowerCase() === query.toLowerCase());
    const exactName = localTrains.find(t => (t.name || "").toLowerCase() === query.toLowerCase());
    const match = exactNumber || exactName || results[0];

    if (match) {
      openTrain(match);
    } else {
      addRecentTrainSearch({ number: query, name: "" });
      setRecent(getRecentTrainSearches());
      navigate(`/live/${query}`);
    }
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <span className="eyebrow">TRACK A TRAIN</span>
          <h1>Live Status</h1>
          <p>Search by train number or name to see real-time running status.</p>
        </div>
      </div>

      <form className="searchbar big" onSubmit={handleSubmit}>
        <Search size={19}/>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Enter train number or name (e.g. 12556, Gorakhdham)"
        />
      </form>

      {q.trim() && (
        <div className="panel" style={{ marginTop: 16 }}>
          {results.length === 0
            ? <div className="empty-state">No trains found for "{q}"</div>
            : <div className="train-list">
                {results.map(t => (
                  <div key={t.number} className="train-row" onClick={() => openTrain(t)} style={{ cursor: "pointer" }}>
                    <TrainFront size={16}/>
                    <div>
                      <b>{t.number} · {t.name}</b>
                      <span>{t.fromCode || t.from} → {t.toCode || t.to}</span>
                    </div>
                  </div>
                ))}
              </div>}
        </div>
      )}

      {!q.trim() && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head">
            <div><b><History size={16}/> Recent searches</b><span>Jump back in</span></div>
            {recent.length > 0 &&
              <button className="text-btn" onClick={() => { clearRecentTrainSearches(); setRecent([]); }}>
                <X size={14}/> Clear
              </button>}
          </div>
          {recent.length === 0
            ? <p style={{ color: "#5f7a9f", marginLeft: 15 }} className="empty-hint">No searches yet — try looking up a train above.</p>
            : <div className="chip-grid">
                {recent.map(r => (
                  <button key={r.number} onClick={() => navigate(`/live/${r.number}`)}>
                    {r.number}{r.name ? ` · ${r.name}` : ""}
                  </button>
                ))}
              </div>}
        </div>
      )}
    </div>
  );
}