import { useState, useEffect } from "react";
import logo from "./assets/logo.jpeg";
export default function App() {
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem("entries");
    return saved ? JSON.parse(saved) : [];
  });
  const [note, setNote] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    let interval;
    if (running && startTime) {
      interval = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running, startTime]);

  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries]);

  const start = () => {
    setStartTime(Date.now());
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    setShowInput(true);
  };

  const save = () => {
    const now = new Date();

    const newEntry = {
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
  };

  const format = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const exportCSV = (entries) => {
    const header = "Datum;Start;Ende;Zeit (s);Beschreibung\n";

    const rows = entries
      .map((e) => `${e.date};${e.start};${e.end};${e.time};${e.note}`)
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
    transform: "scale(1)",
transition: "0.2s",
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
          {e.date} | {e.start} - {e.end} | {format(e.time)} - {e.note}
        </div>
      ))}
    </div>
  </div>
);
}
