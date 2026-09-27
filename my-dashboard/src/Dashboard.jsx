import React, { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const VIDEO_API_URL = "http://localhost:3000/camera-stream";
const METRICS_API_URL = "http://localhost:3000/metrics";
const MAX_POINTS = 200;

export default function Dashboard() {
  const [pressureData, setPressureData] = useState([]);
  const [breathingData, setBreathingData] = useState([]);
  const [error, setError] = useState(null);

  const lastTimestamp = useRef({ pressure: null, breathing: null });

  function mergeIfNew(rawField, key, setter, toTime) {
    // rawField is an array with 0 or 1 items: [{ value, timestamp }]
    const point = Array.isArray(rawField) ? rawField[0] : rawField;
    if (!point) return; // nothing returned this poll

    if (point.timestamp === lastTimestamp.current[key]) return; // cached repeat, skip

    lastTimestamp.current[key] = point.timestamp;

    setter((prev) =>
      [...prev, { name: toTime(point.timestamp), value: point.value, ts: point.timestamp }]
        .slice(-MAX_POINTS)
    );
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(METRICS_API_URL);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();

        const breathing = json.metrics?.breathing || {};
        const cardio = json.metrics?.cardio || {};
        const toTime = (ts) => new Date(Number(ts) / 1000).toLocaleTimeString();

        mergeIfNew(cardio.arterialPressureTrace, "pressure", setPressureData, toTime);
        mergeIfNew(breathing.upperTrace, "breathing", setBreathingData, toTime);
      } catch (err) {
        setError("API error: " + err.message);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem", fontFamily: "sans-serif" }}>
      <div>
        <h3>Webcam</h3>
        <img
          src={VIDEO_API_URL}
          alt="Live camera feed"
          style={{ width: 320, height: 240, background: "#000", borderRadius: 8 }}
        />
      </div>

      <div style={{ flex: 1 }}>
        <h3>Live Data</h3>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <h4>Arterial Pressure</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={pressureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#ff7300" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>

        <h4>Breathing</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={breathingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#387908" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}