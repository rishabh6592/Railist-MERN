import { Router } from "express";
import PNR from "../models/PNR.js";
import { isLive, fetchPNRStatus } from "../services/railwayApi.js";

const router = Router();
let demoPNRs = [];

export function setDemoPNRs(data) {
  demoPNRs = data;
}

router.get("/:pnr", async (req, res, next) => {
  const pnr = String(req.params.pnr);

  // Try the real, live provider first if a RAPIDAPI_KEY is configured.
  if (isLive) {
    try {
      const live = await fetchPNRStatus(pnr);
      if (live) return res.json(live);
    } catch (error) {
      console.warn("Live PNR lookup failed, falling back to demo/DB:", error.message);
    }
  }

  try {
    const result = PNR.db.readyState === 1
      ? await PNR.findOne({ pnr }).lean()
      : demoPNRs.find(x => x.pnr === pnr);

    if (!result) return res.status(404).json({ message: "PNR not found" });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
