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
    </div>
  </div>
);
}
