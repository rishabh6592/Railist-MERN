import { Router } from "express";
import Feedback from "../models/Feedback.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const payload = {
      rating: Number(req.body.rating || 0),
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      message: String(req.body.message || "").slice(0, 1000)
    };

    if (Feedback.db.readyState === 1) {
      const saved = await Feedback.create(payload);
      return res.status(201).json(saved);
    }

    res.status(201).json({ ...payload, demo: true, createdAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

export default router;
