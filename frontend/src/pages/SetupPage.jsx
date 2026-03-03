import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebateStore } from "../store/debateStore.js";
import { PERSONAS, HUMAN_PERSONA, ALL_PERSONAS, TOPICS, HUMAN_ID } from "../store/personas.js";
import { PersonaAvatar } from "../components/PersonaAvatar.jsx";
import styles from "./SetupPage.module.css";

export function SetupPage() {
  const navigate  = useNavigate();
  const store     = useDebateStore();
  const [editingId, setEditingId]     = useState(null);
  const [topicFocused, setTopicFocused] = useState(false);
  const [humanMode, setHumanMode]     = useState(store.humanMode || "text");
  const [micStatus, setMicStatus]     = useState("idle"); // idle | checking | granted | denied

  const hasHuman = store.selectedPersonaIds.includes(HUMAN_ID);

  const handleStart = () => {
    if (!store.topic.trim()) { store.setError("Enter a debate topic."); return; }
    if (store.selectedPersonaIds.length < 2) { store.setError("Select at least 2 debaters."); return; }
    const aiCount = store.selectedPersonaIds.filter(id => id !== HUMAN_ID).length;
    if (aiCount < 1) { store.setError("Select at least 1 AI debater."); return; }

    store.setHumanMode(humanMode);
    store.setError(null);
    // Only clear runtime state — preserve topic, selections, and overrides
    store.resetRuntimeOnly();
    navigate("/debate");
  };

  const requestMic = async () => {
    setMicStatus("checking");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus("granted");
      setHumanMode("mic");
    } catch {
      setMicStatus("denied");
      setHumanMode("text");
    }
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoSymbol}>⚔</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--white-mute)", letterSpacing:3 }}>
              DISPUTO / v4.0
            </span>
          </div>
          <button className={styles.pillBtn}
            data-accent={store.voiceEnabled ? "#4fffb0" : undefined}
            onClick={() => store.setVoiceEnabled(!store.voiceEnabled)}>
            {store.voiceEnabled ? "🔊 VOICE ON" : "🔇 VOICE OFF"}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>— INTELLECTUAL COMBAT ENGINE —</p>
        <h1 className={styles.heroTitle}>
          <span className="glitch" data-text="DISPUTO">DISPUTO</span>
        </h1>
        <p className={styles.heroSub}>
          Pit AI personas against each other — or step in yourself.
        </p>
      </section>

      <main className={styles.main}>

        {/* 01 TOPIC */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>01 — THE TOPIC</label>
          <div className={styles.topicWrapper}
            style={{ borderColor: topicFocused ? "#666" : "#222" }}>
            <textarea className={styles.topicInput}
              value={store.topic}
              onChange={e => store.setTopic(e.target.value)}
              onFocus={() => setTopicFocused(true)}
              onBlur={() => setTopicFocused(false)}
              placeholder="What should they fight about? Controversies, religion, politics, philosophy — all fair game."
              rows={2}
            />
          </div>
          <div className={styles.suggestions}>
            {TOPICS.slice(0,5).map(t => (
              <button key={t} className={styles.suggestionChip} onClick={() => store.setTopic(t)}>
                {t.length > 52 ? t.slice(0,52)+"…" : t}
              </button>
            ))}
          </div>
        </section>

        {/* 02 DEBATERS */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            02 — SELECT DEBATERS
            <span style={{ color:"var(--white-mute)", fontWeight:400 }}>
              {" "}({store.selectedPersonaIds.length} selected · min 2)
            </span>
          </label>

          <div className={styles.personaGrid}>
            {ALL_PERSONAS.map((persona) => {
              const id       = persona.id;
              const isHuman  = !!persona.isHuman;
              const selected = store.selectedPersonaIds.includes(id);

              return (
                <button key={id}
                  className={styles.personaCard}
                  data-selected={selected}
                  style={{
                    borderColor: selected ? persona.color+"80" : isHuman ? "#1a1a2e" : "#1e1e1e",
                    background:  selected ? persona.color+"08" : isHuman ? "#08080f" : "#0d0d0d",
                    boxShadow:   selected ? `0 0 24px ${persona.color}15,inset 0 0 24px ${persona.color}05` : "none",
                  }}
                  onClick={() => store.togglePersona(id, 5)}
                >
                  {/* Card top row */}
                  <div className={styles.personaCardTop}>
                    {isHuman ? (
                      <div style={{
                        width:60, height:60, display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:26, flexShrink:0,
                        border:`1px solid ${selected ? "#ffffff50" : "#1a1a2e"}`,
                        background: selected ? "#ffffff06" : "#0a0a18",
                        transition:"all 0.3s",
                      }}>👤</div>
                    ) : (
                      <PersonaAvatar persona={persona} isSpeaking={false} isActive={selected} size={60} showName={false} />
                    )}

                    <div className={styles.personaInfo}>
                      <div className={styles.personaName}
                        style={{ color: selected ? persona.color : "var(--white-dim)" }}>
                        {store.personaOverrides[id]?.name || persona.name}
                      </div>
                      <div className={styles.personaIdeology}>
                        {store.personaOverrides[id]?.ideology || persona.ideology}
                      </div>
                      <div className={styles.personaTagline}>"{persona.tagline}"</div>
                    </div>

                    <div className={styles.personaCheck}
                      style={{ borderColor: selected ? persona.color : "#2a2a2a",
                               background:  selected ? persona.color : "transparent" }}>
                      {selected && <span style={{ color:"#000", fontSize:11 }}>✓</span>}
                    </div>
                  </div>

                  <p className={styles.personaStyle}>
                    {(store.personaOverrides[id]?.style || persona.style).slice(0,82)}…
                  </p>

                  {/* Expanded controls */}
                  {selected && (
                    <div onClick={e => e.stopPropagation()}
                      style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>

                      {/* ── Human card controls ── */}
                      {isHuman && (
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          <div style={{
                            fontFamily:"var(--font-mono)", fontSize:8,
                            color:"var(--white-mute)", letterSpacing:2, marginBottom:2,
                          }}>YOUR INPUT METHOD</div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                            <button
                              onClick={e => { e.stopPropagation(); setHumanMode("text"); }}
                              style={{
                                fontSize:9, padding:"7px 4px", fontFamily:"var(--font-mono)",
                                letterSpacing:0.5, textAlign:"center", cursor:"pointer",
                                background: humanMode==="text" ? "#ffffff" : "transparent",
                                color:      humanMode==="text" ? "#000" : "var(--white-mute)",
                                border:`1px solid #ffffff40`,
                              }}>
                              ⌨ TYPE
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); requestMic(); }}
                              style={{
                                fontSize:9, padding:"7px 4px", fontFamily:"var(--font-mono)",
                                letterSpacing:0.5, textAlign:"center", cursor:"pointer",
                                background: humanMode==="mic" ? "#ffffff" : "transparent",
                                color:      humanMode==="mic"  ? "#000"
                                          : micStatus==="denied" ? "#ff4f4f"
                                          : "var(--white-mute)",
                                border:`1px solid ${micStatus==="denied" ? "#ff4f4f50" : "#ffffff40"}`,
                              }}>
                              {micStatus==="checking" ? "…" : micStatus==="denied" ? "✗ MIC DENIED" : "🎤 SPEAK"}
                            </button>
                          </div>
                          {micStatus==="denied" && (
                            <p style={{ fontFamily:"var(--font-mono)", fontSize:8,
                              color:"#ff4f4f80", letterSpacing:0.5, margin:0 }}>
                              Mic blocked — typing mode active. Enable mic in browser settings to use voice.
                            </p>
                          )}
                        </div>
                      )}

                      {/* ── AI persona editor ── */}
                      {!isHuman && (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); setEditingId(editingId===id ? null : id); }}
                            style={{
                              fontSize:9, fontFamily:"var(--font-mono)",
                              background:"transparent", color:"var(--white-mute)",
                              border:"1px solid #252525", padding:"4px 8px",
                              cursor:"pointer", letterSpacing:1, textAlign:"left", width:"100%",
                            }}>
                            {editingId===id ? "▲ CLOSE" : "▼ CUSTOMISE PERSONA"}
                          </button>

                          {editingId===id && (
                            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

                              {/* Name */}
                              <div>
                                <div style={{ fontFamily:"var(--font-mono)", fontSize:8,
                                  color:"var(--white-mute)", letterSpacing:1, marginBottom:3 }}>
                                  NAME
                                </div>
                                <input
                                  value={store.personaOverrides[id]?.name ?? persona.name}
                                  onChange={e => store.setPersonaOverride(id, "name", e.target.value)}
                                  style={fieldStyle}
                                />
                              </div>

                              {/* Ideology */}
                              <div>
                                <div style={{ fontFamily:"var(--font-mono)", fontSize:8,
                                  color:"var(--white-mute)", letterSpacing:1, marginBottom:3 }}>
                                  IDEOLOGY / WORLDVIEW
                                </div>
                                <div style={{ fontFamily:"var(--font-mono)", fontSize:8,
                                  color:"#363030", letterSpacing:0.3, marginBottom:4, fontStyle:"italic" }}>
                                  e.g. "Sunni Islamic Scholar", "Cold War CIA Analyst", "Radical Ecofeminist"
                                </div>
                                <input
                                  value={store.personaOverrides[id]?.ideology ?? persona.ideology}
                                  onChange={e => store.setPersonaOverride(id, "ideology", e.target.value)}
                                  style={fieldStyle}
                                />
                              </div>

                              {/* Style */}
                              <div>
                                <div style={{ fontFamily:"var(--font-mono)", fontSize:8,
                                  color:"var(--white-mute)", letterSpacing:1, marginBottom:3 }}>
                                  DEBATE PERSONALITY & STYLE
                                </div>
                                <div style={{ fontFamily:"var(--font-mono)", fontSize:8,
                                  color:"#363030", letterSpacing:0.3, marginBottom:4, fontStyle:"italic", lineHeight:1.5 }}>
                                  Describe HOW they argue, what they cite, their tone and rhetorical weapons.
                                  The AI reads this literally — be as specific as you want.
                                  e.g. "Cites hadith and classical fiqh scholars. Uses measured, authoritative tone.
                                  Challenges Western moral frameworks as culturally imperialist."
                                </div>
                                <textarea
                                  value={store.personaOverrides[id]?.style ?? persona.style}
                                  rows={4}
                                  onChange={e => store.setPersonaOverride(id, "style", e.target.value)}
                                  style={{ ...fieldStyle, resize:"vertical", lineHeight:1.5 }}
                                />
                              </div>

                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 03 SETTINGS */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>03 — SETTINGS</label>
          <div className={styles.settingsRow}>
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>TOTAL TURNS</div>
              <div className={styles.turnButtons}>
                {[6,8,10,12,16,20,24,30].map(n => (
                  <button key={n} className={styles.turnBtn}
                    data-active={store.totalTurns===n}
                    style={{
                      borderColor: store.totalTurns===n ? "#aaa" : "#222",
                      color:       store.totalTurns===n ? "var(--white)" : "var(--white-mute)",
                      background:  store.totalTurns===n ? "#1a1a1a" : "transparent",
                    }}
                    onClick={() => store.setTotalTurns(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {store.error && <div className={styles.errorBox}>{store.error}</div>}

        <button className={styles.startBtn} onClick={handleStart} data-hover>
          <span>{hasHuman ? "ENTER THE DEBATE" : "BEGIN THE DEBATE"}</span>
          <span className={styles.startArrow}>→</span>
        </button>

        <p style={{ textAlign:"center", fontFamily:"var(--font-mono)", fontSize:10,
          color:"var(--white-mute)", letterSpacing:2, marginTop:20 }}>
          POWERED BY GROQ + LLAMA 3.3 · FREE TO RUN
        </p>
      </main>
    </div>
  );
}

const fieldStyle = {
  width:"100%", background:"#0c0c0c", border:"1px solid #252525",
  color:"var(--white)", fontFamily:"var(--font-mono)", fontSize:10,
  padding:"5px 7px", outline:"none", boxSizing:"border-box",
};
