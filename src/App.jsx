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

  const [workerName, setWorkerName] = useState(() => {
    const saved = localStorage.getItem("workerName");
    return saved ? saved : "Simon";
  });

  const [note, setNote] = useState("");
  const [isExpense, setIsExpense] = useState(false);
const [amount, setAmount] = useState("");
  const [editStart, setEditStart] = useState("");
const [editEnd, setEditEnd] = useState("");
const [showInput, setShowInput] = useState(false);
 const [showExpenseInput, setShowExpenseInput] = useState(false);

  const workers = ["Simon", "Loris", "Dominik", "Jannic", "Joelle", "Joasch" ];

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

  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("workerName", workerName);
  }, [workerName]);

  const start = () => {
    const now = Date.now();
    setStartTime(now);
    setRunning(true);

    localStorage.setItem("running", "true");
    localStorage.setItem("startTime", String(now));
  };
const stop = () => {
  const now = new Date();

  setRunning(false);
  setShowInput(true);

  setEditStart(new Date(startTime).toTimeString().slice(0, 5));
  setEditEnd(now.toTimeString().slice(0, 5));

  localStorage.setItem("running", "false");
};

const openExpense = () => {
  setShowExpenseInput(true);
  setShowInput(false);
};

  const save = () => {
  if (!isExpense && !startTime) return;

  const now = new Date();
  let newEntry;

  if (isExpense) {
    newEntry = {
      type: "expense",
      worker: workerName,
      amount: amount,
      note: note,
      date: now.toLocaleDateString(),
    };
  } else {
    const dateString = now.toLocaleDateString();

    const startDate = new Date(now);
    const [startHour, startMinute] = editStart.split(":");
    startDate.setHours(Number(startHour), Number(startMinute), 0, 0);

    const endDate = new Date(now);
    const [endHour, endMinute] = editEnd.split(":");
    endDate.setHours(Number(endHour), Number(endMinute), 0, 0);

    const correctedSeconds = Math.max(
      0,
      Math.floor((endDate - startDate) / 1000)
    );

    newEntry = {
      type: "time",
      worker: workerName,
      time: correctedSeconds,
      note: note,
      date: dateString,
      start: editStart,
      end: editEnd,
    };
  }

  setEntries([newEntry, ...entries]);
  setNote("");
  setAmount("");
  setSeconds(0);
  setShowInput(false);
  setShowExpenseInput(false);
  setStartTime(null);

  localStorage.setItem("running", "false");
  localStorage.removeItem("startTime");
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
  .map((e) => {
    if (e.type === "expense") {
      return `${e.worker};${e.date};;;${e.amount} km;${e.note}`;
    } else {
      return `${e.worker};${e.date};${e.start};${e.end};${e.time};${e.note}`;
    }
  })
  .join("\n");

    const csvContent = "\uFEFF" + header + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "zeiterfassung.csv";
    link.click();
  };

  const clearEntries = () => {
    const confirmDelete = window.confirm(
      "Willst du wirklich das ganze Archiv löschen?"
    );

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

      <div style={{ position: "relative", padding: 30 }}>
        <h1 style={{ fontSize: "48px" }}>Zeiterfassung</h1>

        {!isExpense && <h2>{format(seconds)}</h2>}
<div style={{ marginBottom: 20 }}>
  <button
    onClick={() => {
      setIsExpense(false);
      setShowExpenseInput(false);
    }}
    style={{
      marginRight: 10,
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      background: !isExpense ? "#4CAF50" : "#888",
      color: "white",
      cursor: "pointer",
    }}
  >
    ⏱ Zeit
  </button>

  <button
    onClick={() => {
      setIsExpense(true);
      openExpense();
    }}
    style={{
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      background: isExpense ? "#4CAF50" : "#888",
      color: "white",
      cursor: "pointer",
    }}
  >
    💸 Spesen
  </button>
</div>
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

       {!isExpense && (
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
)}

       {!isExpense && (
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
)}

     {/* ZEIT INPUT */}
{showInput && !isExpense && (
  <div style={{ marginTop: 20 }}>
    <div style={{ marginBottom: 10 }}>
      <label>Start: </label>
      <input
        type="time"
        value={editStart}
        onChange={(e) => setEditStart(e.target.value)}
      />

      <label style={{ marginLeft: 10 }}>Ende: </label>
      <input
        type="time"
        value={editEnd}
        onChange={(e) => setEditEnd(e.target.value)}
      />
    </div>

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
{/* SPESEN INPUT */}
{showExpenseInput && isExpense && (
  <div style={{ marginTop: 20 }}>
    <input
      placeholder="Kilometer (z. B. 25)"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      style={{ marginRight: 10 }}
    />

    <input
      placeholder="Bemerkung (z. B. Kunde XY)"
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

      <h3 style={{ marginTop: 30 }}>Zeiterfassung Archiv</h3>

{entries
  .filter((e) => e.type !== "expense")
  .map((e, i) => (
    <div key={i}>
      {e.worker} | {e.date} | {e.start} - {e.end} | {format(e.time)} - {e.note}
    </div>
  ))}
<h3 style={{ marginTop: 30 }}>Übersicht</h3>

<div>
  Gesamtzeit:{" "}
  {format(
    entries
      .filter((e) => e.type !== "expense")
      .reduce((sum, e) => sum + Number(e.time || 0), 0)
  )}
</div>
<h3 style={{ marginTop: 30 }}>Spesen Archiv</h3>

{entries
  .filter((e) => e.type === "expense")
  .map((e, i) => (
    <div key={i}>
      💸 {e.worker} | {e.date} | {e.amount} km - {e.note}
    </div>
  ))}
      </div>
    </div>
  );
}