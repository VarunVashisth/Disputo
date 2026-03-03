import { useRef, useCallback } from "react";
import { useDebateStore } from "../store/debateStore.js";
import { useTTS } from "./useTTS.js";
import { HUMAN_ID } from "../store/personas.js";

const API = "/api/debate";

function listenForSpeech(lang = "en-US") {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { reject(new Error("not-supported")); return; }
    const rec = new SR();
    rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = e => resolve(e.results[0][0].transcript);
    rec.onerror  = e => reject(new Error(e.error));
    rec.start();
  });
}

export function useDebate(allPersonas) {
  const store = useDebateStore();
  const { speak, cancel } = useTTS(store.voiceEnabled);
  const runningRef = useRef(false);

  const startDebate = useCallback(async () => {
    if (!store.topic.trim()) { store.setError("Please enter a debate topic."); return; }

    // Build resolved persona list preserving order
    const resolvedPersonas = store.selectedPersonaIds.map(idx => {
      const base = allPersonas.find(p => p.id === idx);
      if (!base) return null;
      if (base.isHuman) return { ...base, humanMode: store.humanMode };
      return store.getPersona(base);
    }).filter(Boolean);

    const aiOnly = resolvedPersonas.filter(p => !p.isHuman);
    if (aiOnly.length < 1) { store.setError("Select at least one AI debater."); return; }

    runningRef.current = true;
    store.setIsRunning(true);
    store.setPhase("debate");
    store.setError(null);

    // Start backend session with AI personas only (they hold the session state)
    let sessionId;
    try {
      const res = await fetch(`${API}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: store.topic, personas: aiOnly, totalTurns: store.totalTurns }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      sessionId = data.sessionId;
      store.setSession(sessionId);
    } catch (err) {
      store.setError(err.message); store.setIsRunning(false); runningRef.current = false; return;
    }

    // Main loop — iterate over ALL personas (including human) round-robin
    for (let turn = 0; turn < store.totalTurns; turn++) {
      if (!runningRef.current) break;

      store.setCurrentTurn(turn);
      store.setIsLoading(true);
      store.setStreamingText("");

      const persona = resolvedPersonas[turn % resolvedPersonas.length];
      store.setCurrentSpeaker(persona);

      let entry = null;

      if (persona.isHuman) {
        // ── Human turn ──────────────────────────────────
        store.setIsLoading(false);
        let humanText = "";

        if (persona.humanMode === "mic") {
          store.setStreamingText("🎤  Listening…");
          try {
            humanText = await listenForSpeech();
          } catch {
            // mic failed — fall through to text input
            store.setStreamingText("🎤  Mic unavailable — type your argument below");
            humanText = await store.beginHumanTurn();
          }
        } else {
          humanText = await store.beginHumanTurn();
        }

        if (!runningRef.current) break;
        if (humanText === "[skipped]") { store.setStreamingText(""); continue; }

        store.setStreamingText(humanText);
        await new Promise(r => setTimeout(r, 300));

        entry = {
          personaId: HUMAN_ID, personaName: "YOU", ideology: "Human",
          color: "#ffffff", persona, summary: humanText,
          turn: turn + 1, isHuman: true,
        };

        // Push human text into backend session memory so AI has context
        try {
          await fetch(`${API}/inject`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, entry }),
          });
        } catch { /* non-fatal */ }

      } else {
        // ── AI turn ──────────────────────────────────────
        try {
          const res = await fetch(`${API}/turn`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          if (!res.ok) throw new Error("Turn request failed");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const ev = JSON.parse(line.slice(6));
                if (ev.type === "turn_start") { store.setCurrentSpeaker(ev.persona); store.setIsLoading(false); }
                if (ev.type === "chunk")       store.appendStreamingText(ev.text);
                if (ev.type === "turn_end")    entry = ev.entry;
                if (ev.type === "error")       throw new Error(ev.message);
              } catch {}
            }
          }
        } catch (err) {
          store.setError(`Turn ${turn+1}: ${err.message}`); break;
        }
      }

      store.setIsLoading(false);

      if (entry) {
        await new Promise(r => setTimeout(r, 200));
        store.pushArgument(entry);
        store.setStreamingText("");
        if (runningRef.current && !entry.isHuman) {
          await speak(entry.summary, entry.persona);
        }
      }

      if (runningRef.current && turn < store.totalTurns - 1) {
        await new Promise(r => setTimeout(r, 650));
      }
    }

    store.setCurrentSpeaker(null);
    store.setStreamingText("");
    store.setIsRunning(false);
    store.cancelHumanTurn();
    runningRef.current = false;
    store.setPhase("ended");
  }, [store, allPersonas, speak]);

  const stopDebate = useCallback(() => {
    runningRef.current = false;
    cancel();
    store.setIsRunning(false);
    store.setCurrentSpeaker(null);
    store.setStreamingText("");
    store.cancelHumanTurn();
    store.setPhase("ended");
  }, [store, cancel]);

  return { startDebate, stopDebate };
}
