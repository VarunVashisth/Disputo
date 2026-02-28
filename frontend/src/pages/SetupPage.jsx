// ============================================================
// SetupPage — Debate configuration screen
// Grungy B&W aesthetic, glitch title, persona cards
// ============================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebateStore } from "../store/debateStore.js";
import { PERSONAS, TOPICS } from "../store/personas.js";
import { PersonaAvatar } from "../components/PersonaAvatar.jsx";
import styles from "./SetupPage.module.css";


export function SetupPage() {
  const [editingId , setEditingId] = React.useState(null);
  const navigate = useNavigate();
  const store = useDebateStore();
  const [topicFocused, setTopicFocused] = useState(false);

  const handleStart = () => {
    if (!store.topic.trim()) {
      store.setError("Enter a debate topic to begin.");
      return;
    }
    if (store.selectedPersonaIds.length < 2) {
      store.setError("Select at least 2 debaters.");
      return;
    }
    store.setError(null);
    store.resetDebate();
    // Re-set topic and personas after reset
    store.setTopic(store.topic);
    navigate("/debate");
  };

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoSymbol}>⚔</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--white-mute)", letterSpacing: 3 }}>
              AI DEBATE SIMULATOR / v1.0
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              className={styles.pillBtn}
              data-accent={store.voiceEnabled ? "#4fffb0" : undefined}
              onClick={() => store.setVoiceEnabled(!store.voiceEnabled)}
            >
              {store.voiceEnabled ? "🔊 VOICE ON" : "🔇 VOICE OFF"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>— INTELLECTUAL COMBAT ENGINE —</p>
        <h1 className={styles.heroTitle}>
          <span className="glitch" data-text="DEBATE">DEBATE</span>
        </h1>
        <h1 className={styles.heroTitle} style={{ marginTop: -12 }}>
          SIMULATOR
        </h1>
        <p className={styles.heroSub}>
          Multiple AI personas. One topic. No bluffing. No repetition.
        </p>
      </section>

      {/* ── Main Form ──────────────────────────────────────── */}
      <main className={styles.main}>

        {/* TOPIC */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>01 — THE TOPIC</label>
          <div className={styles.topicWrapper} style={{ borderColor: topicFocused ? "#666" : "#222" }}>
            <textarea
              className={styles.topicInput}
              value={store.topic}
              onChange={e => store.setTopic(e.target.value)}
              onFocus={() => setTopicFocused(true)}
              onBlur={() => setTopicFocused(false)}
              placeholder="What should they fight about?"
              rows={2}
            />
          </div>
          {/* Suggestions */}
          <div className={styles.suggestions}>
            {TOPICS.slice(0, 5).map(t => (
              <button
                key={t}
                className={styles.suggestionChip}
                onClick={() => store.setTopic(t)}
              >
                {t.length > 48 ? t.slice(0, 48) + "…" : t}
              </button>
            ))}
          </div>
        </section>

        {/* PERSONAS */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            02 — SELECT DEBATERS
            <span style={{ color: "var(--white-mute)", fontWeight: 400 }}> ({store.selectedPersonaIds.length}/4 selected · min 2)</span>
          </label>
          <div className={styles.personaGrid}>
            {PERSONAS.map((persona, idx) => {
              const selected = store.selectedPersonaIds.includes(idx);
              return (
                <button
                  key={persona.id}
                  className={styles.personaCard}
                  data-selected={selected}
                  data-accent={persona.color}
                  style={{
                    borderColor: selected ? persona.color + "80" : "#1e1e1e",
                    background: selected ? persona.color + "08" : "#0d0d0d",
                    boxShadow: selected ? `0 0 24px ${persona.color}15, inset 0 0 24px ${persona.color}05` : "none",
                  }}
                  onClick={() => store.togglePersona(idx)}
                >
          <div className={styles.personaCardTop}>
            <PersonaAvatar
              persona={persona}
              isSpeaking={false}
              isActive={selected}
              size={60}
              showName={false}
            />
            <div className={styles.personaInfo}>
              <div className={styles.personaName} style={{ color: selected ? persona.color : "var(--white-dim)" }}>
                {persona.name}
              </div>
              <div className={styles.personaIdeology}>{persona.ideology}</div>
              <div className={styles.personaTagline}>"{persona.tagline}"</div>
            </div>
            <div className={styles.personaCheck} style={{
              borderColor: selected ? persona.color : "#2a2a2a",
              background: selected ? persona.color : "transparent",
            }}>
              {selected && <span style={{ color: "#000", fontSize: 11 }}>✓</span>}
            </div>
          </div>
          
          <p className={styles.personaStyle}>{persona.style.slice(0, 80)}…</p>
          
          {/* ── Stance + Edit — outside the checkbox, full card width ── */}
          {selected && (
            <div
              onClick={e => e.stopPropagation()}
              style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}
            >
              {/* Stance picker */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 4,
                width: "100%",
              }}>
                {["FOR", "AGAINST", "NEUTRAL"].map(s => (
                  <button
                    key={s}
                    onClick={e => { e.stopPropagation(); store.setPersonaStance(persona.id, s); }}
                    style={{
                      fontSize: 9,
                      padding: "5px 4px",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: 0.5,
                      textAlign: "center",
                      background: store.getPersonaStance(persona.id) === s ? persona.color : "transparent",
                      color: store.getPersonaStance(persona.id) === s ? "#000" : "var(--white-mute)",
                      border: `1px solid ${persona.color}40`,
                      cursor: "pointer",
                      lineHeight: 1.5,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
          
              {/* Edit persona toggle */}
              <button
                onClick={e => { e.stopPropagation(); setEditingId(editingId === persona.id ? null : persona.id); }}
                style={{
                  fontSize: 9, fontFamily: "var(--font-mono)",
                  background: "transparent", color: "var(--white-mute)",
                  border: "1px solid #2a2a2a", padding: "3px 8px",
                  cursor: "pointer", letterSpacing: 1, textAlign: "left",
                  width: "100%",
                }}
              >
                {editingId === persona.id ? "▲ CLOSE EDIT" : "▼ EDIT PERSONA"}
              </button>
          
              {/* Edit fields */}
              {editingId === persona.id && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { key: "name",     label: "NAME",         multiline: false },
                    { key: "ideology", label: "IDEOLOGY",     multiline: false },
                    { key: "style",    label: "DEBATE STYLE", multiline: true  },
                  ].map(({ key, label, multiline }) => {
                    const current = store.personaOverrides[persona.id]?.[key] ?? persona[key];
                    const Tag = multiline ? "textarea" : "input";
                    return (
                      <div key={key}>
                        <div style={{
                          fontSize: 8, fontFamily: "var(--font-mono)",
                          color: "var(--white-mute)", letterSpacing: 1, marginBottom: 3,
                        }}>
                          {label}
                        </div>
                        <Tag
                          value={current}
                          rows={multiline ? 3 : undefined}
                          onChange={e => store.setPersonaOverride(persona.id, key, e.target.value)}
                          style={{
                            width: "100%", background: "#0f0f0f",
                            border: "1px solid #2a2a2a", color: "var(--white)",
                            fontFamily: "var(--font-mono)", fontSize: 10,
                            padding: "4px 6px", outline: "none",
                            resize: multiline ? "vertical" : "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
                </button>
              );
            })}
          </div>
        </section>

        {/* SETTINGS */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>03 — SETTINGS</label>
          <div className={styles.settingsRow}>
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>TOTAL TURNS</div>
              <div className={styles.turnButtons}>
                {[4, 6, 8, 10, 12, 16].map(n => (
                  <button
                    key={n}
                    className={styles.turnBtn}
                    data-active={store.totalTurns === n}
                    style={{
                      borderColor: store.totalTurns === n ? "#aaa" : "#222",
                      color: store.totalTurns === n ? "var(--white)" : "var(--white-mute)",
                      background: store.totalTurns === n ? "#1a1a1a" : "transparent",
                    }}
                    onClick={() => store.setTotalTurns(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {store.error && (
          <div className={styles.errorBox}>{store.error}</div>
        )}

        {/* START */}
        <button
          className={styles.startBtn}
          onClick={handleStart}
          data-hover
        >
          <span>BEGIN THE DEBATE</span>
          <span className={styles.startArrow}>→</span>
        </button>

        <p style={{
          textAlign: "center", fontFamily: "var(--font-mono)",
          fontSize: 10, color: "var(--white-mute)", letterSpacing: 2, marginTop: 20,
        }}>
          POWERED BY GROQ + LLAMA 3.3 · FREE TO RUN
        </p>
      </main>
    </div>
  );
}
