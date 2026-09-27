import React, { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const VIDEO_API_URL = "http://localhost:3000/camera-stream";
const METRICS_API_URL = "http://localhost:3000/metrics";

export default function Dashboard() {
  const [pressureData, setPressureData] = useState([]);
  const [breathingData, setBreathingData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(METRICS_API_URL);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();

        const breathing = json.metrics?.breathing || {};
        const cardio = json.metrics?.cardio || {};
        const toTime = (ts) => new Date(Number(ts) / 1000).toLocaleTimeString();

        setPressureData(
          (cardio.arterialPressureTrace || []).map((p) => ({
            name: toTime(p.timestamp),
            value: p.value,
          }))
        );

        setBreathingData(
          (breathing.upperTrace || []).map((p) => ({
            name: toTime(p.timestamp),
            value: p.value,
          }))
        );
      } catch (err) {
        setError("API error: " + err.message);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 1000); // 1s — adjust as needed
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
            <Line type="monotone" dataKey="value" stroke="#ff7300" dot={false} />
          </LineChart>
        </ResponsiveContainer>

        <h4>Breathing</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={breathingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#387908" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}