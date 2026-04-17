const express = require('express');
const { supabase } = require('./db');

const router = express.Router();

router.get('/fasts', async (req, res) => {
  try {
    console.log('[ROUTE] GET /fasts - fetching all fasts');
    const { data, error } = await supabase
      .from('fasts')
      .select('*')
      .order('start_time', { ascending: false });
    
    if (error) throw error;
    console.log(`[ROUTE] GET /fasts - returning ${data.length} fasts`);
    res.json(data);
  } catch (error) {
    console.error('[ROUTE] GET /fasts - ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/fasts/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fasts')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Fast not found' });
    res.json(data);
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
    
    const { data, error } = await supabase
      .from('fasts')
      .insert([{
        planned_hours: plannedHours,
        start_time: startTime,
        end_time: endTime,
        ended_early: false
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/fasts/:id', async (req, res) => {
  try {
    const { plannedHours, startTime, endTime, endedAt, endedEarly } = req.body;
    
    const updates = {};
    if (plannedHours !== undefined) updates.planned_hours = plannedHours;
    if (startTime !== undefined) updates.start_time = startTime;
    if (endTime !== undefined) updates.end_time = endTime;
    if (endedAt !== undefined) updates.ended_at = endedAt;
    if (endedEarly !== undefined) updates.ended_early = endedEarly;
    
    const { data, error } = await supabase
      .from('fasts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Fast not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/fasts/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('fasts')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/fasts', async (req, res) => {
  try {
    let query = supabase.from('fasts').delete();
    
    if (req.query.ended === 'true') {
      query = query.not('ended_at', 'is', null);
    }
    
    const { error } = await query;
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
