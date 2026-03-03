import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebateStore } from "../store/debateStore.js";
import { ALL_PERSONAS, HUMAN_ID } from "../store/personas.js";
import { useDebate } from "../hooks/useDebate.js";
import { DebateTable } from "../components/DebateTable.jsx";
import { ArgumentFeed } from "../components/ArgumentFeed.jsx";
import styles from "./DebatePage.module.css";

export function DebatePage() {
  const navigate = useNavigate();
  const store    = useDebateStore();
  const { startDebate, stopDebate } = useDebate(ALL_PERSONAS);
  const hasStarted = useRef(false);

  const selectedPersonas = store.selectedPersonaIds
    .map(id => ALL_PERSONAS.find(p => p.id === id))
    .filter(Boolean);

  useEffect(() => {
    if (!hasStarted.current && store.topic) {
      hasStarted.current = true;
      startDebate();
    } else if (!store.topic) {
      navigate("/");
    }
  }, []);

  const handleStop  = () => stopDebate();
  const handleReset = () => { stopDebate(); store.resetDebate(); navigate("/"); };

  const exportTranscript = () => {
    const lines = [

      "   DISPUTO — DEBATE TRANSCRIPT",
      
      `   Topic:    ${store.topic}`,
      `   Date:     ${new Date().toLocaleString()}`,
      `   Debaters: ${selectedPersonas.map(p => `${p.name} (${p.ideology})`).join(", ")}`,
         ,
      ...store.argumentHistory.map(h =>
        `[Turn ${h.turn}] ${h.personaName}${h.isHuman ? " [HUMAN]" : ""} — ${h.ideology}\n"${h.summary}"\n`
      ),
      ,
    ];
    const blob = new Blob([lines.join("\n")], { type:"text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `disputo-${Date.now()}.txt`;
    a.click();
  };

  const progress = store.totalTurns > 0
    ? Math.min((store.currentTurn / store.totalTurns) * 100, 100) : 0;

  const speakerColor = store.currentSpeaker?.color || "#888";

  return (
    <div className={styles.page}>

      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <button className={styles.backBtn} onClick={handleReset} data-hover>← BACK</button>
          <div className={styles.topicDisplay}>
            <span className={styles.topicLabel}>TOPIC</span>
            <span className={styles.topicText}>{store.topic}</span>
          </div>
        </div>
        <div className={styles.topRight}>
          <div className={styles.turnCounter}>
            <span style={{ color:"var(--white-mute)" }}>TURN </span>
            <span style={{ color:"var(--white-dim)" }}>{Math.min(store.currentTurn+1, store.totalTurns)}</span>
            <span style={{ color:"var(--white-mute)" }}>/{store.totalTurns}</span>
          </div>
          {store.isRunning ? (
            <button className={styles.stopBtn} onClick={handleStop} data-hover>⏹ STOP</button>
          ) : store.phase === "ended" ? (
            <button className={styles.exportBtn} onClick={exportTranscript} data-hover>↓ EXPORT</button>
          ) : null}
        </div>
      </header>

      {/* Progress */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{
          width:`${progress}%`,
          background:`linear-gradient(90deg,#1a1a1a,${speakerColor})`,
        }} />
      </div>

      {/* Status strip */}
      <div className={styles.statusStrip}>
        <div className={styles.statusDot} data-active={store.isRunning} />
        <span className={styles.statusText}>
          {store.awaitingHuman
            ? "YOUR TURN — type below or speak"
            : store.isLoading && store.currentSpeaker
            ? `${store.currentSpeaker.name} IS THINKING…`
            : store.currentSpeaker && !store.isLoading
            ? `${store.currentSpeaker.name} IS SPEAKING`
            : store.phase === "ended"
            ? `DEBATE CONCLUDED · ${store.argumentHistory.length} ARGUMENTS`
            : store.isRunning ? "DEBATE IN PROGRESS" : "READY"}
        </span>
        {store.currentSpeaker && (
          <span className={styles.statusIdeology}>
            {store.currentSpeaker.ideology.toUpperCase()}
          </span>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>

        {/* LEFT — 3D table */}
        <div className={styles.leftPanel}>
          <DebateTable
            personas={selectedPersonas}
            currentSpeaker={store.currentSpeaker}
            isRunning={store.isRunning}
            streamingText={store.streamingText}
          />

          {/* Human input box */}
          {store.awaitingHuman && (
            <div style={{
              padding:"14px 16px",
              borderTop:`1px solid #1e1e1e`,
              background:"#080808",
              display:"flex", gap:10, alignItems:"flex-end",
            }}>
              <textarea
                autoFocus
                value={store.humanInputText}
                onChange={e => store.setHumanInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    store.submitHumanInput();
                  }
                }}
                placeholder="Your argument… (Enter to submit, Shift+Enter for newline)"
                rows={3}
                style={{
                  flex:1, background:"#0f0f0f", border:`1px solid #ffffff30`,
                  color:"var(--white)", fontFamily:"var(--font-body)",
                  fontSize:14, padding:"10px 14px", outline:"none",
                  resize:"none", lineHeight:1.6,
                  boxShadow:`0 0 16px #ffffff12`,
                }}
              />
              <button
                onClick={() => store.submitHumanInput()}
                style={{
                  padding:"10px 18px", background:"#ffffff", color:"#000",
                  fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:2,
                  border:"none", cursor:"pointer", flexShrink:0,
                }}>
                SEND →
              </button>
            </div>
          )}

          {/* Participants */}
          <div className={styles.participants}>
            {selectedPersonas.map(p => (
              <div key={p.id} className={styles.participant}
                style={{ opacity: store.currentSpeaker?.id === p.id ? 1 : 0.3 }}>
                <div className={styles.participantDot} style={{ background: p.color }} />
                <span className={styles.participantName}
                  style={{ color: store.currentSpeaker?.id === p.id ? p.color : "#444" }}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>

          {store.phase === "ended" && (
            <div className={styles.endPanel}>
              <p className={styles.endText}>— DEBATE CONCLUDED —</p>
              <div className={styles.endBtns}>
                <button className={styles.endBtn} onClick={exportTranscript} data-hover>EXPORT TRANSCRIPT</button>
                <button className={styles.endBtn} onClick={handleReset} data-hover>NEW DEBATE</button>
              </div>
            </div>
          )}

          {store.error && <div className={styles.errorBox}>{store.error}</div>}
        </div>

        {/* RIGHT — argument feed */}
        <div className={styles.rightPanel}>
          <div className={styles.feedHeader}>
            <span className={styles.feedLabel}>ARGUMENT FEED</span>
            <span className={styles.feedCount}>{store.argumentHistory.length} ARGUMENTS</span>
          </div>
          <ArgumentFeed
            argumentHistory={store.argumentHistory}
            currentSpeaker={store.currentSpeaker}
            streamingText={store.streamingText}
            isLoading={store.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
