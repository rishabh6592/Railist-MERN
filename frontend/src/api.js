import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 60000,
});

export async function getTrains(query = "") {
  const { data } = await api.get(
    `/trains${query ? `?q=${encodeURIComponent(query)}` : ""}`
  );

  // Backend agar array bhej raha hai
  if (Array.isArray(data)) {
    return data;
  }

  // Backend agar { data: [...] } bhej raha hai
  if (Array.isArray(data?.data)) {
    return data.data;
  }

  // Backend agar { trains: [...] } bhej raha hai
  if (Array.isArray(data?.trains)) {
    return data.trains;
  }

  return [];
}

export async function getTrain(number, date) {
  const { data } = await api.get(`/trains/${number}`, {
    params: date ? { date } : undefined,
  });

  // { data: {...} } response handle
  return data?.data || data;
}

// =====================================================
// LIVE STATION DEPARTURES (UP & DOWN NEXT 6 HOURS)
// =====================================================
export async function getStationLive(stationCode, hours = 6) {
  try {
    const { data } = await api.get(`/stations/${stationCode}/live`, {
      params: { hours },
    });

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.trains)) return data.trains;

    return [];
  } catch (err) {
    console.warn(`Station live departures failed for ${stationCode}:`, err.message);
    return [];
  }
}

export async function getPNR(pnr) {
  const { data } = await api.get(`/pnr/${pnr}`);
  return data?.data || data;
}

export async function submitFeedback(payload) {
  const { data } = await api.post("/feedback", payload);
  return data;
}

export async function getStations(query = "") {
  const { data } = await api.get(
    `/stations${query ? `?q=${encodeURIComponent(query)}` : ""}`
  );

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.stations)) return data.stations;

  return [];
}