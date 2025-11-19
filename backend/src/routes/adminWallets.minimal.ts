import express from "express";

const router = express.Router();

// Simple test route to verify the router works
router.get("/test", (req, res) => {
  res.json({ message: "Admin wallets router is working" });
});

export default router;
