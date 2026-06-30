import { useState, useEffect } from "react";
import logo from "./assets/logo.jpeg";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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
  
  const COLORS = [
  "#D62828", // Alpine Rot
  "#444444", // Dunkelgrau
  "#777777", // Hellgrau
  "#AAAAAA", // Silber
  "#555555",
  "#888888",
];

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
const chartData = equityData
  .filter((item) => item.Person && item.Equity !== "")
  .map((item) => ({
    name: item.Person,
    value: Number(item.Equity || 0) * 100,
  }));
  const percent = (value) => `${Number(value || 0).toFixed(1)}%`;
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
  const googleSheets = [
  {
    name: "Master-Aufträge",
    icon: "📋",
    url: "https://docs.google.com/spreadsheets/d/1aI3pfl4L-rmJwTtmnpEH04z3WkF6UsIjtUuW4OHD1TY/edit?usp=sharing",
  },
  {
  name: "Lead-Tracker",
  icon: "🎯",
  url: "https://docs.google.com/spreadsheets/d/1vJmvnhfoqRYlbH6tPOOaMIVTxDtSpyLXaH3-rC8J-do/edit?usp=sharing",
},
  {
  name: "Einkauf & Lager",
  icon: "📦",
  url: "https://docs.google.com/spreadsheets/d/13KLIOb-EQuLNnMkOewHEV9qsTXQAQa-BUMEpA10L0mg/edit?usp=sharing",
},
  {
  name: "Team ToDos",
  icon: "✅",
  url: "https://docs.google.com/spreadsheets/d/10hjUVodemwm9mJc-jBNQt1RTV-7C5-lAGCX32SZFMH0/edit?usp=sharing",
},
  {
  name: "Preiskalkulator",
  icon: "🧮",
  url: "https://docs.google.com/spreadsheets/d/15jRL-AXYkaYlRQ3G-SvAeb6zklxfVDOiEe5zhHBmy3g/edit?usp=sharing",
},
{
  name: "Drucker Wartung",
  icon: "🛠️",
  url: "https://docs.google.com/spreadsheets/d/1-Zu4shSE4NTftDeTRWlIJybkSfX_bbxO-RlsPScdWW4/edit?usp=sharing",
},
{
  name: "Social Media",
  icon: "📱",
  url: "https://docs.google.com/spreadsheets/d/14f1ZFda-rkR-hXflJ3YGdb8YqkcX8cN5ayVOVqnc5oA/edit?usp=sharing",
},
];

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
<div
  style={{
    marginTop: 30,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  }}
>
  <button
    onClick={() => exportCSV(entries)}
    style={{
      width: "100%",
      padding: "14px 18px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.25)",
      background: "rgba(255,255,255,0.12)",
      color: "white",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    📊 Archiv exportieren
  </button>

  <button
    onClick={clearEntries}
    style={{
      width: "100%",
      padding: "14px 18px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.25)",
      background: "rgba(255,255,255,0.08)",
      color: "#ffb3b3",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    🗑 Archiv löschen
  </button>
</div>
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

    <div
      style={{
        marginTop: 20,
        padding: 20,
        borderRadius: 18,
        background: "rgba(20,20,20,0.85)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Equity</h2>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={3}
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <button onClick={loadEquity}>🔄 Aktualisieren</button>
    </div>
  </>
)}

{activeTab === "sheets" && (
  <>
    <h1 style={{ fontSize: "42px" }}>Google Sheets</h1>

    {googleSheets.map((sheet) => (
      <button
        key={sheet.name}
        onClick={() => window.open(sheet.url, "_blank")}
        style={{
          width: "100%",
          padding: "18px",
          marginBottom: "12px",
          borderRadius: "12px",
          border: "none",
          background: "#D62828",
          color: "white",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {sheet.icon} {sheet.name}
      </button>
    ))}
  </>
)}

</div>

<div
  style={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    background: "#111",
    borderTop: "1px solid #333",
  }}
>
  <button
    onClick={() => setActiveTab("time")}
    style={{
      flex: 1,
      padding: "12px 8px",
      background: activeTab === "time" ? "#4CAF50" : "transparent",
      color: "white",
      border: "none",
      fontWeight: "bold",
      cursor: "pointer",
      height: 70,
    }}
  >
    ⏱<br />Zeiterfassung
  </button>

  <button
    onClick={() => setActiveTab("overview")}
    style={{
      flex: 1,
      padding: "12px 8px",
      background: activeTab === "overview" ? "#4CAF50" : "transparent",
      color: "white",
      border: "none",
      fontWeight: "bold",
      cursor: "pointer",
      height: 70,
    }}
  >
    📊<br />Übersicht
  </button>

  <button
    onClick={() => setActiveTab("sheets")}
    style={{
      flex: 1,
      padding: "12px 8px",
      background: activeTab === "sheets" ? "#4CAF50" : "transparent",
      color: "white",
      border: "none",
      fontWeight: "bold",
      cursor: "pointer",
      height: 70,
    }}
  >
    📄<br />Google Sheets
  </button>
</div>
</div>
);
}