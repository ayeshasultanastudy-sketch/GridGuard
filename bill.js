// routes/bill.js
// POST /api/bill        — save or update a monthly bill
// GET  /api/bill        — get all saved months for this user
// GET  /api/bill/:month — get one specific month e.g. 2026-06

const express = require('express');
const { getPool }     = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

// ── POST /api/bill ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { monthYear, kwh, sar, people, panels, evs, rate } = req.body;

  if (!monthYear || !kwh || !sar)
    return res.status(400).json({ error: 'monthYear, kwh and sar are required' });

  try {
    const pool = getPool();

    // INSERT ... ON DUPLICATE KEY UPDATE means:
    // if this user already has a row for this month, update it
    // otherwise insert a new row
    await pool.execute(
      `INSERT INTO gridguard_bills (user_id, month_year, kwh, sar, people, panels, evs, rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         kwh = VALUES(kwh), sar = VALUES(sar), people = VALUES(people),
         panels = VALUES(panels), evs = VALUES(evs), rate = VALUES(rate)`,
      [
        req.user.userId,
        monthYear,
        Number(kwh),
        Number(sar),
        Number(people) || 1,
        Number(panels) || 0,
        Number(evs)    || 0,
        Number(rate)   || 0.18
      ]
    );

    res.status(201).json({ message: 'Bill saved' });

  } catch (err) {
    console.error('Save bill error:', err);
    res.status(500).json({ error: 'Failed to save bill' });
  }
});

// ── GET /api/bill ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pool = getPool();

    const [rows] = await pool.execute(
      `SELECT month_year AS monthYear, kwh, sar, people, panels, evs, rate, saved_at AS savedAt
       FROM gridguard_bills
       WHERE user_id = ?
       ORDER BY month_year DESC`,
      [req.user.userId]
    );

    res.json({ bills: rows });

  } catch (err) {
    console.error('Get bills error:', err);
    res.status(500).json({ error: 'Failed to retrieve bills' });
  }
});

// ── GET /api/bill/:month ──────────────────────────────────────────────────────
router.get('/:month', async (req, res) => {
  try {
    const pool = getPool();

    const [rows] = await pool.execute(
      `SELECT month_year AS monthYear, kwh, sar, people, panels, evs, rate, saved_at AS savedAt
       FROM gridguard_bills
       WHERE user_id = ? AND month_year = ?`,
      [req.user.userId, req.params.month]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: 'No bill found for that month' });

    res.json({ bill: rows[0] });

  } catch (err) {
    console.error('Get bill error:', err);
    res.status(500).json({ error: 'Failed to retrieve bill' });
  }
});

module.exports = router;
