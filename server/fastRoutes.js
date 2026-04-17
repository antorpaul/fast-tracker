const express = require('express');
const db = require('./db');

const router = express.Router();

router.get('/fasts', async (req, res) => {
  try {
    console.log('[ROUTE] GET /fasts - fetching all fasts');
    const fasts = await db.all(
      'SELECT * FROM fasts ORDER BY start_time DESC'
    );
    console.log(`[ROUTE] GET /fasts - returning ${fasts.length} fasts`);
    res.json(fasts);
  } catch (error) {
    console.error('[ROUTE] GET /fasts - ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/fasts/:id', async (req, res) => {
  try {
    const fast = await db.get('SELECT * FROM fasts WHERE id = ?', [req.params.id]);
    if (!fast) return res.status(404).json({ error: 'Fast not found' });
    res.json(fast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fasts', async (req, res) => {
  try {
    const { plannedHours, startTime, endTime } = req.body;
    if (!plannedHours || !startTime || !endTime) {
      return res.status(400).json({ error: 'plannedHours, startTime, and endTime are required' });
    }
    const now = Date.now();
    const result = await db.run(
      'INSERT INTO fasts (planned_hours, start_time, end_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [plannedHours, startTime, endTime, now, now]
    );
    const fast = await db.get('SELECT * FROM fasts WHERE id = ?', [result.id]);
    res.status(201).json(fast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/fasts/:id', async (req, res) => {
  try {
    const { plannedHours, startTime, endTime, endedAt, endedEarly } = req.body;
    const fast = await db.get('SELECT * FROM fasts WHERE id = ?', [req.params.id]);
    if (!fast) return res.status(404).json({ error: 'Fast not found' });
    const updatedAt = Date.now();
    const updatedFast = {
      plannedHours: plannedHours ?? fast.planned_hours,
      startTime: startTime ?? fast.start_time,
      endTime: endTime ?? fast.end_time,
      endedAt: endedAt ?? fast.ended_at,
      endedEarly: endedEarly !== undefined ? (endedEarly ? 1 : 0) : fast.ended_early
    };
    await db.run(
      'UPDATE fasts SET planned_hours = ?, start_time = ?, end_time = ?, ended_at = ?, ended_early = ?, updated_at = ? WHERE id = ?',
      [updatedFast.plannedHours, updatedFast.startTime, updatedFast.endTime, updatedFast.endedAt, updatedFast.endedEarly, updatedAt, req.params.id]
    );
    const fresh = await db.get('SELECT * FROM fasts WHERE id = ?', [req.params.id]);
    res.json(fresh);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/fasts/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM fasts WHERE id = ?', [req.params.id]);
    if (!result.changes) return res.status(404).json({ error: 'Fast not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/fasts', async (req, res) => {
  try {
    const query = req.query.ended === 'true'
      ? 'DELETE FROM fasts WHERE ended_at IS NOT NULL'
      : 'DELETE FROM fasts';
    const result = await db.run(query);
    res.json({ success: true, deleted: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
