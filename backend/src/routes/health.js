import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// Get user's health data (mock for now - map to real wearables later)
router.get('/data', async (req, res) => {
  // In real impl, get from wearables or user records
  const mockData = {
    vitals: {
      heartRate: 72,
      bloodPressure: '120/80',
      sleepHours: 8,
    },
    scans: [
      { type: 'Full Body', status: 'Normal', date: new Date().toISOString() },
    ],
    protocols: [
      { name: 'Daily Exercise', progress: 75 },
      { name: 'Meditation', progress: 50 },
    ],
  };
  res.json(mockData);
});

// Update health record
router.post('/record', async (req, res) => {
  const { type, value } = req.body;
  // Save to DB (placeholder)
  res.json({ success: true, record: { type, value, timestamp: new Date() } });
});

export default router;
