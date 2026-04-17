'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
const PRESET_HOURS = [8, 12, 15];

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRemaining(ms) {
  if (ms <= 0) return 'Done';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : `${minutes}m ${seconds}s`;
}

function toLocalInputValue(ms) {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function HomePage() {
  const [selectedMode, setSelectedMode] = useState('preset');
  const [selectedPresetHours, setSelectedPresetHours] = useState(8);
  const [customHours, setCustomHours] = useState('');
  const [startTime, setStartTime] = useState(() => toLocalInputValue(Date.now()));
  const [history, setHistory] = useState([]);
  const [activeFast, setActiveFast] = useState(null);
  const [setupMessage, setSetupMessage] = useState({ text: '', type: '' });
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [tick, setTick] = useState(0); // Live clock ticker

  const completedHistory = useMemo(
    () => history.filter((item) => item.ended_at !== null),
    [history]
  );

  const allFasts = useMemo(() => history, [history]);

  // Check if there's any active or upcoming fast (not ended)
  const upcomingOrActiveFast = useMemo(
    () => history.find((fast) => fast.ended_at === null) ?? null,
    [history]
  );

  const isIncomingFast = useMemo(
    () => activeFast && activeFast.start_time > Date.now(),
    [activeFast, tick]
  );

  const currentProgress = useMemo(() => {
    if (!activeFast) return { percent: 0, remaining: 0, total: 1 };
    const now = Date.now();
    const total = activeFast.end_time - activeFast.start_time;
    const elapsed = Math.max(0, now - activeFast.start_time);
    const remaining = Math.max(0, activeFast.end_time - now);
    return {
      percent: Math.min(100, Math.floor((elapsed / total) * 100)),
      remaining,
      total,
    };
  }, [activeFast, tick]);

  const incomingProgress = useMemo(() => {
    if (!isIncomingFast) return { remaining: 0 };
    const now = Date.now();
    const remaining = Math.max(0, activeFast.start_time - now);
    return { remaining };
  }, [activeFast, isIncomingFast, tick]);

  useEffect(() => {
    fetchFasts();
  }, []);

  // Live clock ticker - updates UI every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => {
      // Check if current fast has ended
      if (!isIncomingFast && activeFast.end_time - Date.now() <= 0) {
        endFast(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeFast, isIncomingFast]);

  async function fetchFasts() {
    try {
      const response = await fetch(`${API_BASE}/fasts`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load fasts');
      setHistory(data);
      setActiveFast(data.find((fast) => fast.ended_at === null) ?? null);
    } catch (error) {
      setStatusMessage({ text: error.message, type: 'error' });
    }
  }

  function clearMessages() {
    setSetupMessage({ text: '', type: '' });
    setStatusMessage({ text: '', type: '' });
  }

  function getRequestedHours() {
    if (selectedMode === 'custom') {
      const value = parseFloat(customHours);
      return Number.isFinite(value) && value > 0 ? value : null;
    }
    return selectedPresetHours;
  }

  async function startFast() {
    clearMessages();
    
    // Check if there's already an active or upcoming fast
    if (upcomingOrActiveFast) {
      const isFastIncoming = upcomingOrActiveFast.start_time > Date.now();
      if (isFastIncoming) {
        setSetupMessage({
          text: `Cannot start a new fast. You have an incoming fast scheduled for ${formatDate(upcomingOrActiveFast.start_time)}.`,
          type: 'error',
        });
      } else {
        setSetupMessage({
          text: 'Cannot start a new fast. You already have an active fast in progress.',
          type: 'error',
        });
      }
      return;
    }

    const hours = getRequestedHours();
    if (!hours) {
      setSetupMessage({ text: 'Enter a valid fasting duration greater than 0 hours.', type: 'error' });
      return;
    }
    const parsedStart = new Date(startTime).getTime();
    if (!parsedStart || Number.isNaN(parsedStart)) {
      setSetupMessage({ text: 'Enter a valid start time.', type: 'error' });
      return;
    }
    const endTime = parsedStart + hours * 60 * 60 * 1000;
    try {
      const response = await fetch(`${API_BASE}/fasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plannedHours: hours, startTime: parsedStart, endTime }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to start fast');
      setActiveFast(data);
      const messageText = parsedStart > Date.now()
        ? `Scheduled a ${hours}-hour fast to start at ${formatDate(parsedStart)}.`
        : `Started a ${hours}-hour fast.`;
      setStatusMessage({ text: messageText, type: 'success' });
      await fetchFasts();
    } catch (error) {
      setSetupMessage({ text: error.message, type: 'error' });
    }
  }

  async function endFast(endedEarly) {
    if (!activeFast) {
      setStatusMessage({ text: 'There is no active fast to end.', type: 'error' });
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/fasts/${activeFast.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endedAt: Date.now(), endedEarly }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to end fast');
      setStatusMessage({
        text: endedEarly ? 'Fast ended early and saved to history.' : 'Fast completed and saved to history.',
        type: endedEarly ? 'error' : 'success',
      });
      setActiveFast(null);
      await fetchFasts();
    } catch (error) {
      setStatusMessage({ text: error.message, type: 'error' });
    }
  }

  async function clearHistory() {
    try {
      const response = await fetch(`${API_BASE}/fasts?ended=true`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to clear history');
      setStatusMessage({ text: 'History cleared.', type: 'success' });
      await fetchFasts();
    } catch (error) {
      setStatusMessage({ text: error.message, type: 'error' });
    }
  }

  return (
    <main className="app">
      <section className="card">
        <h1>Fast Tracker</h1>
        <p>Pick 8, 12, 15 hours, or enter a custom duration. The app calculates your fasting end time from your current time and saves sessions to the backend.</p>
      </section>

      <section className="card">
        <h2>Start a fast</h2>
        <div className="presets">
          {PRESET_HOURS.map((hours) => (
            <button
              key={hours}
              type="button"
              className={`preset ${selectedMode === 'preset' && selectedPresetHours === hours ? 'selected' : ''}`}
              onClick={() => {
                setSelectedMode('preset');
                setSelectedPresetHours(hours);
                setSetupMessage({ text: `${hours}-hour fast selected.`, type: 'success' });
              }}
            >
              {hours} hours
            </button>
          ))}
          <button
            className={`preset ${selectedMode === 'custom' ? 'selected' : ''}`}
            type="button"
            onClick={() => {
              setSelectedMode('custom');
              setSetupMessage({ text: 'Custom mode selected. Enter a duration and start the fast.', type: 'success' });
            }}
          >
            Custom
          </button>
        </div>
        <div className="row">
          <div>
            <label htmlFor="customHours">Custom duration in hours</label>
            <input
              id="customHours"
              type="number"
              min="0.25"
              step="0.25"
              placeholder="Example: 16 or 18.5"
              value={customHours}
              onChange={(event) => {
                setCustomHours(event.target.value);
                setSelectedMode('custom');
              }}
            />
          </div>
          <button className="primary" type="button" onClick={startFast}>
            Start fast
          </button>
        </div>
        <div className="row" style={{ marginTop: '12px' }}>
          <div>
            <label htmlFor="startTimeInput">Start time</label>
            <input
              id="startTimeInput"
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div />
        </div>
        <div className={`message ${setupMessage.type === 'success' ? 'success' : setupMessage.type === 'error' ? 'error' : ''}`}>
          {setupMessage.text}
        </div>
      </section>

      <section className="card">
        <h2>{isIncomingFast ? 'Incoming fast' : 'Current fast'}</h2>
        <div className="status-grid">
          <div className="metric">
            <div className="label">{isIncomingFast ? 'Time till start' : 'Time remaining'}</div>
            <div className="value" id="remaining">
              {activeFast
                ? isIncomingFast
                  ? formatRemaining(incomingProgress.remaining)
                  : formatRemaining(currentProgress.remaining)
                : '—'}
            </div>
          </div>
          <div className="metric">
            <div className="label">Started at</div>
            <div className="value small">{activeFast ? formatDate(activeFast.start_time) : '—'}</div>
          </div>
          <div className="metric">
            <div className="label">Ends at</div>
            <div className="value small">{activeFast ? formatDate(activeFast.end_time) : '—'}</div>
          </div>
        </div>
        <div className="bar">
          <div className="fill" style={{ width: `${isIncomingFast ? 0 : currentProgress.percent}%` }} />
        </div>
        <div className="bar-meta">
          <span id="progressLabel">
            {activeFast
              ? isIncomingFast
                ? 'Incoming fast scheduled'
                : `${activeFast.planned_hours}-hour fast in progress`
              : 'No active fast'}
          </span>
          <span id="percent">{activeFast && !isIncomingFast ? `${currentProgress.percent}%` : '0%'}</span>
        </div>
        <div className="actions">
          <button className="danger" type="button" onClick={() => endFast(true)}>
            End fast early
          </button>
          <button className="secondary" type="button" onClick={clearHistory}>
            Clear history
          </button>
        </div>
        <div className={`message ${statusMessage.type === 'success' ? 'success' : statusMessage.type === 'error' ? 'error' : ''}`}>
          {statusMessage.text}
        </div>
      </section>

      <section className="card">
        <h2>Recent sessions</h2>
        <div className="history">
          {completedHistory.length === 0 ? (
            <div className="history-item">
              <p>No fasting sessions yet.</p>
            </div>
          ) : (
            completedHistory.map((item) => (
              <div className="history-item" key={item.id}>
                <strong>{item.planned_hours}-hour fast</strong>
                <p>Started: {formatDate(item.start_time)}</p>
                <p>Ended: {formatDate(item.ended_at)}</p>
                <p>Actual duration: {((item.ended_at - item.start_time) / 3600000).toFixed(2).replace(/\.00$/, '')} hours</p>
                <span className={`badge ${item.ended_early ? 'early' : ''}`}>
                  {item.ended_early ? 'Ended early' : 'Completed'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
