import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

import TrainCard from "../components/TrainCard";
import { getTrains, getTrain } from "../api";

export default function Search() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [q, setQ] = useState(params.get("q") || "");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;

    const search = async () => {
      const query = q.trim();

      // Empty search -> no local/static trains
      if (!query) {
        setData([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        let rows = [];

        // -----------------------------------------
        // TRAIN NUMBER -> DIRECT LIVE API
        // -----------------------------------------
        if (/^\d{4,6}$/.test(query)) {
          console.log("🚆 Searching LIVE train:", query);

          const train = await getTrain(query);

          if (train) {
            rows = [train];
          }
        }

        // -----------------------------------------
        // NAME / STATION / ROUTE -> LIVE SEARCH API
        // -----------------------------------------
        else {
          console.log("🔎 Searching LIVE trains:", query);

          rows = await getTrains(query);
        }

        if (!live) return;

        setData(Array.isArray(rows) ? rows : []);

        if (!rows || rows.length === 0) {
          setError("No live train found.");
        }
      } catch (err) {
        console.error("❌ LIVE SEARCH ERROR:", err);

        if (!live) return;

        setData([]);
        setError(
          err?.response?.data?.message ||
          "Live train data could not be loaded."
        );
      } finally {
        if (live) {
          setLoading(false);
        }
      }
    };

    // Small debounce so API isn't called on every keystroke
    const timer = setTimeout(search, 350);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [q]);

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-title">
        <div>
          <span className="eyebrow">TRAIN DISCOVERY</span>

          <h1>Search trains</h1>

          <p>
            Find live trains by number, name, station or route.
          </p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="searchbar big">
        <SearchIcon size={20} />

        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try 12556, Gorakhpur, NDLS..."
        />

        {q && (
          <button
            onClick={() => setQ("")}
            title="Clear search"
          >
            <X size={17} />
          </button>
        )}

        <button className="filter">
          <SlidersHorizontal size={17} />
          Filters
        </button>
      </div>

      {/* RESULT META */}
      <div className="result-meta">
        <b>
          {loading ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Loader2 size={14} className="spin" />
              Searching live trains...
            </span>
          ) : (
            `${data.length} trains found`
          )}
        </b>

        <span>
          {loading ? "Fetching live data..." : "Live API"}
        </span>
      </div>

      {/* ERROR */}
      {!loading && error && (
        <div
          className="empty-state"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 16,
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* RESULTS */}
      {!loading && data.length > 0 && (
        <div className="search-results">
          {data.map((train) => (
            <TrainCard
              key={train.number}
              train={train}
              onClick={() =>
                navigate(`/live/${train.number}`)
              }
            />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && q.trim() && data.length === 0 && (
        <div className="empty-state">
          No live train found for <b>{q}</b>.
        </div>
      )}

      {/* INITIAL STATE */}
      {!loading && !q.trim() && (
        <div className="empty-state">
          {/* Enter a train number or station to search live data. */}
        </div>
      )}
    </div>
  );
}