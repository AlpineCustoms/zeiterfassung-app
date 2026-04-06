import { useState, useEffect } from "react";
import logo from "./assets/logo.jpeg";
export default function App() {
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [workerName, setWorkerName] = useState(() => {
  const saved = localStorage.getItem("workerName");
  return saved ? saved : "Simon";
});
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem("entries");
    return saved ? JSON.parse(saved) : [];
  });
  const [note, setNote] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    
  const savedRunning = localStorage.getItem("running") === "true";
  const savedStartTime = localStorage.getItem("startTime");

  if (savedRunning && savedStartTime) {
    const parsedStart = Number(savedStartTime);
    setRunning(true);
    setStartTime(parsedStart);
    setSeconds(Math.floor((Date.now() - parsedStart) / 1000));
  }
}, []);

useEffect(() => {
  let interval;

  const updateSeconds = () => {
    if (running && startTime) {
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    }
  };
  
  useEffect(() => {
  localStorage.setItem("workerName", workerName);
}, [workerName]);

  if (running && startTime) {
    updateSeconds();
    interval = setInterval(updateSeconds, 1000);
  }

  const handleVisibilityChange = () => updateSeconds();
  const handleFocus = () => updateSeconds();

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleFocus);


  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleFocus);
  };
}, [running, startTime]);

  const start = () => {
  const now = Date.now();
  setStartTime(now);
  setRunning(true);

  localStorage.setItem("running", "true");
  localStorage.setItem("startTime", String(now));
};

  const stop = () => {
  setRunning(false);
  setShowInput(true);

  localStorage.setItem("running", "false");
};

  const save = () => {
  const now = new Date();

  const newEntry = {
    worker: workerName,
    time: seconds,
    note: note,
    date: now.toLocaleDateString(),
    start: new Date(startTime).toLocaleTimeString(),
    end: now.toLocaleTimeString(),
  };

  setEntries([newEntry, ...entries]);
  setNote("");
  setSeconds(0);
  setShowInput(false);
  setStartTime(null);

  localStorage.setItem("running", "false");
  localStorage.removeItem("startTime");
};

    setEntries([newEntry, ...entries]);
    setNote("");
    setSeconds(0);
    setShowInput(false);
  };

  const format = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const exportCSV = (entries) => {
  const header = "Mitarbeiter;Datum;Start;Ende;Zeit (s);Beschreibung\n";

  const rows = entries
    .map((e) => `${e.worker};${e.date};${e.start};${e.end};${e.time};${e.note}`)
    .join("\n");

  const csvContent = "\uFEFF" + header + rows;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "zeiterfassung.csv";
  link.click();
};

  const clearEntries = () => {
    const deleteEntry = (indexToDelete) => {
  setEntries(entries.filter((_, index) => index !== indexToDelete));
};
  const confirmDelete = window.confirm("Willst du wirklich das ganze Archiv löschen?");
  
  if (confirmDelete) {
    setEntries([]);
  }
};
const workers = ["Simon", "Loris", "Dominik", "Jannic"];
  return (
  <div
    style={{
      position: "relative",
      minHeight: "100vh",
      fontFamily: "Arial",
      color: "white",
    }}
  >
    {/* Hintergrundbild */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${logo})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        opacity: 0.2,
      }}
    />

    {/* Inhalt */}
    <div style={{ position: "relative", padding: 30 }}>
      <h1 style={{ fontSize: "48px" }}>Zeiterfassung</h1>

      <h2>{format(seconds)}</h2>

<div style={{ marginBottom: 20 }}>
  <label style={{ marginRight: 10 }}>Mitarbeiter:</label>
  <select
    value={workerName}
    onChange={(e) => setWorkerName(e.target.value)}
    style={{
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      fontWeight: "bold",
    }}
  >
    {workers.map((worker) => (
      <option key={worker} value={worker}>
        {worker}
      </option>
    ))}
  </select>
</div>
      <button
  onClick={start}
  disabled={running}
  style={{
    marginTop: 10,
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: running ? "#888" : "#4CAF50",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    
  }}
>
  Start
</button>

      <button
  onClick={stop}
  disabled={!running}
  style={{
    marginLeft: 10,
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: !running ? "#888" : "#f44336",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  Stop
</button>

      {showInput && (
        <div style={{ marginTop: 20 }}>
          <input
            placeholder="Was hast du gemacht?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button onClick={save} style={{ marginLeft: 10 }}>
            Speichern
          </button>
        </div>
      )}

      <h3 style={{ marginTop: 30 }}>Archiv</h3>

      <button
  onClick={() => exportCSV(entries)}
  style={{
    marginTop: 20,
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: "#2196F3",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  }}
>
  📊 Export Excel
</button>

      <button
  onClick={clearEntries}
  style={{
    marginTop: 10,
    marginLeft: 10,
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: "#e53935",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  }}
>
  🗑 Archiv löschen
</button>

      {entries.map((e, i) => (
        <div key={i}>
          {e.worker} | {e.date} | {e.start} - {e.end} | {format(e.time)} - {e.note}
        </div>
      ))}
    </div>
  </div>
      )
