// ============================================================
// DEBATE STORE — Zustand
// Single source of truth for all debate state.
// Components read from here; actions mutate here.
// ============================================================

import { create } from "zustand";


export const useDebateStore = create((set, get) => ({
  
  personaOverrides: {},
  personaStances: {},
  // ── Session ────────────────────────────────────────────
  sessionId: null,
  topic: "",
  selectedPersonaIds: [0, 1],
  totalTurns: 10,
  voiceEnabled: true,

  // ── Debate Runtime ─────────────────────────────────────
  phase: "setup",           // "setup" | "debate" | "ended"
  argumentHistory: [],
  currentTurn: 0,
  currentSpeaker: null,     // persona object currently speaking
  streamingText: "",        // text being streamed right now
  isLoading: false,         // waiting for API response
  isRunning: false,
  error: null,

  // ── Actions ────────────────────────────────────────────
  setTopic: (topic) => set({ topic }),
  setTotalTurns: (n) => set({ totalTurns: n }),
  setVoiceEnabled: (v) => set({ voiceEnabled: v }),
  togglePersona: (idx, maxCount = 4) => {
    const { selectedPersonaIds } = get();
    if (selectedPersonaIds.includes(idx)) {
      if (selectedPersonaIds.length <= 2) return; // minimum 2
      set({ selectedPersonaIds: selectedPersonaIds.filter(i => i !== idx) });
    } else {
      if (selectedPersonaIds.length >= maxCount) return;
      set({ selectedPersonaIds: [...selectedPersonaIds, idx] });
    }
  },
  setPersonaStance: (personaId, stance) => set(state => ({ personaStances: {
    ...state.personaStances, [personaId]: stance,
  }})),
  getPersonaStance: (personaId) => get().personaStances[personaId] ?? "FOR",
  setPersonaOverride: (personaId , field , value) => set(state => ({ personaOverrides: {
    ...state.personaOverrides, [personaId]: {
      ...state.personaOverrides[personaId],
      [field]: value,
    }
  }})),
  getPersona: (basePersona) => ({ ...basePersona, ...get(get().personaOverrides[basePersona.id] || {}) }),

  setSession: (sessionId) => set({ sessionId }),
  setPhase: (phase) => set({ phase }),
  setError: (error) => set({ error }),
  setIsRunning: (v) => set({ isRunning: v }),
  setIsLoading: (v) => set({ isLoading: v }),
  setCurrentSpeaker: (p) => set({ currentSpeaker: p }),
  setStreamingText: (t) => set({ streamingText: t }),
  appendStreamingText: (chunk) => set(s => ({ streamingText: s.streamingText + chunk })),
  setCurrentTurn: (n) => set({ currentTurn: n }),

  pushArgument: (entry) => set(s => ({ argumentHistory: [...s.argumentHistory, entry] })),

  resetDebate: () => set({
    sessionId: null,
    phase: "setup",
    argumentHistory: [],
    currentTurn: 0,
    currentSpeaker: null,
    streamingText: "",
    isLoading: false,
    isRunning: false,
    error: null,
  }),
}));
