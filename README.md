# Railist — MERN Live Train Intelligence App

A clean, responsive MERN stack railway app..

## Included
- Dashboard with live enquiry and next-train board (pulls from `/api/trains`, falls back to demo data)
- Train search with station/train filters
- Train details with live delay, current location, next stop, route timeline, live map, coach position and info tabs
- Interactive live route map (SVG, generated per-train from its actual stop list — no map API key needed)
- PNR status lookup
- Stations directory (`/api/stations`, backed by MongoDB with demo fallback)
- Saved trips (persisted to localStorage; star a train on its details page to add it)
- Feedback form
- Alerts / notifications badge reflecting your saved trips
- Dark mode
- Responsive mobile + desktop layout
- PWA manifest + service worker
- Express + MongoDB backend with seed data (trains, PNR, stations)
- Graceful frontend fallback to demo data if backend is not running

## Structure

```text
Railist-MERN/
├── backend/
│   ├── config/
│   ├── models/       
│   ├── routes/       
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── api.js
    │   ├── data.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── styles.css
    ├── package.json
    └── vite.config.js
```

## Run backend

```bash
cd backend
npm install
npm run dev
```

Set `MONGO_URI` in `.env` if MongoDB is available. The server also runs with demo data when MongoDB is unavailable.

## Real-time train data (optional)

By default the app runs entirely on demo data — no external calls, no API key needed.

To pull real live train/PNR data via [RailRadar](https://railradar.in):

1. Sign up free at [railradar.in](https://railradar.in/login) — no credit card needed.
2. Generate a key from your [Developers dashboard](https://railradar.in/developers).
3. Copy it into `backend/.env` as `RAILRADAR_API_KEY`.

Once that's set, `routes/trains.js` and `routes/pnr.js` automatically try RailRadar's live API first (`GET /trains/{number}/live` and `GET /pnr/{pnr}`) and fall back to demo/DB data if the call fails or the key isn't set — no other code changes needed. The mapping from RailRadar's response shape to this app's shape lives in `backend/services/railwayApi.js`.

RailRadar's free sandbox tier is 1,000 requests/month.

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Production build

```bash
cd frontend
npm run build
```

The app is intentionally API-friendly: replace the demo data or connect the Express routes to a live railway provider later.
