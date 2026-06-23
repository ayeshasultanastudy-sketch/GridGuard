// routes/scenarios.js
// POST   /api/scenarios      — save a scenario
// GET    /api/scenarios      — get all scenarios for this user
// DELETE /api/scenarios/:id  — delete one scenario

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool }     = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth); // all routes below require login

// ── POST /api/scenarios ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { panels, turbines, evs, eventLabel, supply, load, balance, risk, colorState } = req.body;

  if (panels == null || turbines == null || evs == null)
    return res.status(400).json({ error: 'panels, turbines and evs are required' });

  try {
    const pool       = getPool();
    const scenarioId = uuidv4();

    await pool.execute(
      `INSERT INTO gridguard_scenarios
       (user_id, scenario_id, panels, turbines, evs, event_label, supply, grid_load, balance, risk, color_state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        scenarioId,
        panels   || 0,
        turbines || 0,
        evs      || 0,
        eventLabel  || 'Normal day',
        supply   || 0,
        load     || 0,
        balance  || 0,
        risk     || 0,
        colorState  || 'green'
      ]
    );

    res.status(201).json({
      message: 'Scenario saved',
      scenario: { scenarioId, panels, turbines, evs, eventLabel, supply, load, balance, risk, colorState, savedAt: new Date().toISOString() }
    });

  } catch (err) {
    console.error('Save scenario error:', err);
    res.status(500).json({ error: 'Failed to save scenario' });
  }
});

// ── GET /api/scenarios ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pool = getPool();

    // Get all scenarios for this user, newest first
    const [rows] = await pool.execute(
      `SELECT scenario_id AS scenarioId, panels, turbines, evs,
              event_label AS eventLabel, supply, grid_load AS load, balance, risk,
              color_state AS colorState, saved_at AS savedAt
       FROM gridguard_scenarios
       WHERE user_id = ?
       ORDER BY saved_at DESC`,
      [req.user.userId]
    );

    res.json({ scenarios: rows });

  } catch (err) {
    console.error('Get scenarios error:', err);
    res.status(500).json({ error: 'Failed to retrieve scenarios' });
  }
});

// ── DELETE /api/scenarios/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();

    // WHERE includes user_id so users can only delete their own scenarios
    const [result] = await pool.execute(
      'DELETE FROM gridguard_scenarios WHERE scenario_id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Scenario not found or not yours' });

    res.json({ message: 'Scenario deleted' });

  } catch (err) {
    console.error('Delete scenario error:', err);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

module.exports = router;
