import allStations from "./allStations.json";

// Search by station name OR code (case-insensitive)
export function searchStations(query, limit = 20) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toUpperCase();

  const codeMatches = [];
  const nameMatches = [];

  for (const s of allStations) {
    if (s.code === q) {
      codeMatches.unshift(s); // exact code match — top priority
    } else if (s.code.startsWith(q)) {
      codeMatches.push(s);
    } else if (s.name && s.name.toUpperCase().includes(q)) {
      nameMatches.push(s);
    }
    if (codeMatches.length + nameMatches.length > limit * 3) break;
  }

  return [...codeMatches, ...nameMatches].slice(0, limit);
}

export function getStationByCode(code) {
  if (!code) return null;
  return allStations.find(s => s.code === code.toUpperCase()) || null;
}

export function getAllStations() {
  return allStations;
}