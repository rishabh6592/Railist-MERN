const TRIPS_KEY = "railist-trips";
const RECENT_SEARCHES_KEY = "railist-recent-searches";
const LIVE_SEARCH_KEY = "railist-live-search-history";

const MAX_RECENT_SEARCHES = 6;
const MAX_LIVE_SEARCHES = 8;

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) — fail silently, state stays in-memory upstream
  }
}

const defaultTrips = [
  { number:"12556", name:"Gorakhham Express", route:"GKP → NDLS", date:"12 May", alert:"Delay alerts on" },
  { number:"12951", name:"Mumbai Rajdhani", route:"MMCT → NDLS", date:"18 May", alert:"Platform alerts on" }
];

/* ---------- Trips ---------- */

export function getTrips() {
  const stored = read(TRIPS_KEY);
  return stored !== null ? stored : defaultTrips;
}

export function isTripSaved(number) {
  return getTrips().some(t => t.number === number);
}

export function toggleTrip(train) {
  const trips = getTrips();
  const exists = trips.some(t => t.number === train.number);
  const next = exists
    ? trips.filter(t => t.number !== train.number)
    : [...trips, {
        number: train.number,
        name: train.name,
        route: `${train.fromCode} → ${train.toCode}`,
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        alert: "Delay alerts on"
      }];
  write(TRIPS_KEY, next);
  return !exists;
}

export function removeTrip(number) {
  write(TRIPS_KEY, getTrips().filter(t => t.number !== number));
}

/* ---------- Recent searches (Search/Dashboard) ---------- */

export function getRecentSearches() {
  return read(RECENT_SEARCHES_KEY) || [];
}

export function addRecentSearch(query) {
  if (!query || !query.trim()) return getRecentSearches();
  const q = query.trim();
  const existing = getRecentSearches().filter(x => x.toLowerCase() !== q.toLowerCase());
  const next = [q, ...existing].slice(0, MAX_RECENT_SEARCHES);
  write(RECENT_SEARCHES_KEY, next);
  return next;
}

export function removeRecentSearch(query) {
  const next = getRecentSearches().filter(x => x !== query);
  write(RECENT_SEARCHES_KEY, next);
  return next;
}

export function clearRecentSearches() {
  write(RECENT_SEARCHES_KEY, []);
}

/* ---------- Live Status search history ---------- */

export function getRecentTrainSearches() {
  return read(LIVE_SEARCH_KEY) || [];
}

export function addRecentTrainSearch(entry) {
  // entry: { number, name }
  if (!entry || !entry.number) return getRecentTrainSearches();
  const existing = getRecentTrainSearches().filter(e => e.number !== entry.number);
  const next = [entry, ...existing].slice(0, MAX_LIVE_SEARCHES);
  write(LIVE_SEARCH_KEY, next);
  return next;
}

export function clearRecentTrainSearches() {
  write(LIVE_SEARCH_KEY, []);
}