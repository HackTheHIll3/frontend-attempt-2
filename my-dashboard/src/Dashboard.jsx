import React, { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// TODO: replace with your real endpoint
const API_URL = "https://your-api.example.com/data";

export default function Dashboard() {
  const videoRef = useRef(null);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  // --- Webcam ---
  useEffect(() => {
    let stream;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((err) => setError("Webcam error: " + err.message));

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // --- API data ---
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        setData(json); // expects [{ name: "...", value: 123 }, ...]
      } catch (err) {
        setError("API error: " + err.message);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem", fontFamily: "sans-serif" }}>
      <div>
        <h3>Webcam</h3>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: 320, height: 240, background: "#000", borderRadius: 8 }}
        />
      </div>

      <div style={{ flex: 1 }}>
        <h3>Live Data</h3>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}