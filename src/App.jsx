import { useState, useEffect } from "react";
import logo from "./assets/logo.jpeg";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybGc1dkBVYs9wfOtwa5x8D-0tZ31MYxjBD3FOInxOG2nrc6fzlCTGWRf33TwuX5Y5TCw/exec";

async function sendToGoogleSheet(data) {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("Google Sheet Fehler:", error);
    return { status: "error", message: error.message };
  }
}
async function loadEquity() {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const data = await response.json();

    if (data.status === "ok") {
      setEquityData(data.equity || []);
    }
  } catch (error) {
    console.error("Equity laden fehlgeschlagen:", error);
  }
}
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
 
const [activeTab, setActiveTab] = useState("time");
const [equityData, setEquityData] = useState([]);
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
  loadEquity();
}, []);

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
  // Zusätzlich in Google Sheet speichern
if (newEntry.type === "time") {
  sendToGoogleSheet({
    type: "time",
    person: newEntry.worker,
    date: newEntry.date,
    start: newEntry.start,
    end: newEntry.end,
    seconds: newEntry.time,
    note: newEntry.note,
  });
}

if (newEntry.type === "expense") {
  sendToGoogleSheet({
    type: "expense",
    person: newEntry.worker,
    date: newEntry.date,
    amount: newEntry.amount,
    km: "",
    note: newEntry.note,
  });
}
  setNote("");
setAmount("");
setShowInput(false);
setShowExpenseInput(false);

if (!isExpense) {
  setSeconds(0);
  setStartTime(null);
  setRunning(false);

  localStorage.setItem("running", "false");
  localStorage.removeItem("startTime");
} else {
  setIsExpense(false);
}
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
      paddingBottom: 90,
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
      {activeTab === "time" && (
        <>
          <h1 style={{ fontSize: "42px" }}>Zeiterfassung</h1>

          {!isExpense && <h2>{format(seconds)}</h2>}

          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => {
                setIsExpense(false);
                setShowExpenseInput(false);
              }}
            >
              ⏱ Zeit
            </button>

            <button
              onClick={() => {
                setIsExpense(true);
                openExpense();
              }}
              style={{ marginLeft: 10 }}
            >
              💸 Spesen
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ marginRight: 10 }}>Mitarbeiter:</label>
            <select
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
            >
              {workers.map((worker) => (
                <option key={worker} value={worker}>
                  {worker}
                </option>
              ))}
            </select>
          </div>

          {!isExpense && (
            <>
              <button onClick={start} disabled={running}>
                Start
              </button>

              <button onClick={stop} disabled={!running} style={{ marginLeft: 10 }}>
                Stop
              </button>
            </>
          )}

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

          {showExpenseInput && isExpense && (
            <div style={{ marginTop: 20 }}>
              <input
                placeholder="Kilometer"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ marginRight: 10 }}
              />

              <input
                placeholder="Bemerkung"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <button onClick={save} style={{ marginLeft: 10 }}>
                Speichern
              </button>
            </div>
          )}

          <h3 style={{ marginTop: 30 }}>Zeiterfassung Archiv</h3>

          {entries
            .filter((e) => e.type !== "expense")
            .map((e, i) => (
              <div key={i}>
                {e.worker} | {e.date} | {e.start} - {e.end} | {format(e.time)} - {e.note}
              </div>
            ))}

          <h3 style={{ marginTop: 30 }}>Spesen Archiv</h3>

          {entries
            .filter((e) => e.type === "expense")
            .map((e, i) => (
              <div key={i}>
                💸 {e.worker} | {e.date} | {e.amount} km - {e.note}
              </div>
            ))}
        </>
      )}

      {activeTab === "overview" && (
        <>
          <h1 style={{ fontSize: "42px" }}>Übersicht</h1>
          <h2>Equity</h2>

          <button onClick={loadEquity} style={{ marginBottom: 20 }}>
            🔄 Aktualisieren
          </button>

          {equityData.map((item, index) => (
            <div key={index} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{item.Person}</strong>
                <strong>{percent(item.Equity)}</strong>
              </div>

              <div
                style={{
                  height: 18,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 20,
                  overflow: "hidden",
                  marginTop: 5,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: percent(item.Equity),
                    background: "#4CAF50",
                  }}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {activeTab === "sheets" && (
        <>
          <h1 style={{ fontSize: "42px" }}>Google Sheets</h1>
          <p>Hier kommen später die Links zu den bearbeitbaren Sheets rein.</p>
        </>
      )}
    </div>

    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "space-around",
        background: "rgba(0,0,0,0.85)",
        padding: "12px 0",
        borderTop: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <button onClick={() => setActiveTab("time")}>⏱<br />Zeiterfassung</button>
      <button onClick={() => setActiveTab("overview")}>📊<br />Übersicht</button>
      <button onClick={() => setActiveTab("sheets")}>📄<br />Google Sheets</button>
      <div
  style={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "space-around",
    padding: "10px",
    background: "#111",
    borderTop: "1px solid #333",
  }}
>
  <button onClick={() => setActiveTab("time")}>
    ⏱ Zeiterfassung
  </button>

  <button onClick={() => setActiveTab("overview")}>
    📊 Übersicht
  </button>

  <button onClick={() => setActiveTab("sheets")}>
    📄 Google Sheets
  </button>
</div>
    </div>
  </div>
);
}