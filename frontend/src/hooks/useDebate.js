// ============================================================
// useDebate — Debate Orchestration Hook
// Controls the full debate lifecycle:
//   1. POST /api/debate/start → get sessionId
//   2. Loop: POST /api/debate/turn → SSE stream → push to store
//   3. Stop on error, user stop, or totalTurns reached
// ============================================================

import { useRef, useCallback } from "react";
import { useDebateStore } from "../store/debateStore.js";
import { useTTS } from "./useTTS.js";

const API = "/api/debate";

export function useDebate(personas) {
  const store = useDebateStore();
  const { speak, cancel } = useTTS(store.voiceEnabled);
  const runningRef = useRef(false);  // ref so async loop sees latest value

  // ── Start Debate ─────────────────────────────────────────
  const startDebate = useCallback(async () => {
    if (!store.topic.trim()) {
      store.setError("Please enter a debate topic.");
      return;
    }

    const selectedPersonas = store.selectedPersonaIds.map(i => personas[i]);
    const personasWithStance = selectedPersonas.map(p => ({   ...p,   stance: store.getPersonaStance(p.id),   }));
    const resolvedPersonas = selectedPersonas.map(p => ({
          ...store.getPersona(p),
          stance: store.getPersonaStance(p.id),
        }));
    runningRef.current = true;
    store.setIsRunning(true);
    store.setPhase("debate");
    store.setError(null);

    // ── Create session on backend ────────────────────────
    let sessionId;
    try {
      const res = await fetch(`${API}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: store.topic,
          personas: resolvedPersonas,
          totalTurns: store.totalTurns,
        }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      sessionId = data.sessionId;
      store.setSession(sessionId);
    } catch (err) {
      store.setError(err.message);
      store.setIsRunning(false);
      runningRef.current = false;
      return;
    }

    // ── Main Debate Loop ─────────────────────────────────
    for (let turn = 0; turn < store.totalTurns; turn++) {
      if (!runningRef.current) break;

      store.setCurrentTurn(turn);
      store.setIsLoading(true);
      store.setStreamingText("");

      let entry = null;

      try {
        // SSE streaming turn
        const res = await fetch(`${API}/turn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
              const event = JSON.parse(line.slice(6));

              if (event.type === "turn_start") {
                store.setCurrentSpeaker(event.persona);
                store.setIsLoading(false);
              }
              if (event.type === "chunk") {
                store.appendStreamingText(event.text);
              }
              if (event.type === "turn_end") {
                entry = event.entry;
              }
              if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch {}
          }
        }
      } catch (err) {
        store.setError(`Error on turn ${turn + 1}: ${err.message}`);
        break;
      }

      store.setIsLoading(false);

      if (entry) {
        // Wait for streaming text animation then push to history + speak
        await new Promise(r => setTimeout(r, 200));
        store.pushArgument(entry);
        store.setStreamingText("");

        if (runningRef.current) {
          await speak(entry.summary, entry.persona);
        }
      }

      // Brief pause between turns
      if (runningRef.current && turn < store.totalTurns - 1) {
        await new Promise(r => setTimeout(r, 700));
      }
    }

    store.setCurrentSpeaker(null);
    store.setStreamingText("");
    store.setIsRunning(false);
    runningRef.current = false;
    store.setPhase("ended");
  }, [store, personas, speak]);

  // ── Stop Debate ──────────────────────────────────────────
  const stopDebate = useCallback(() => {
    runningRef.current = false;
    cancel();
    store.setIsRunning(false);
    store.setCurrentSpeaker(null);
    store.setStreamingText("");
    store.setPhase("ended");
  }, [store, cancel]);

  return { startDebate, stopDebate };
}
