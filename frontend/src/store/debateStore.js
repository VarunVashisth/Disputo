import { create } from "zustand";

export const useDebateStore = create((set, get) => ({

  // ── Config ─────────────────────────────────────────────
  personaOverrides: {},
  sessionId: null,
  topic: "",
  selectedPersonaIds: [0, 1],
  totalTurns: 10,
  voiceEnabled: true,
  humanMode: "text", // "mic" | "text"

  // ── Runtime ────────────────────────────────────────────
  phase: "setup",
  argumentHistory: [],
  currentTurn: 0,
  currentSpeaker: null,
  streamingText: "",
  isLoading: false,
  isRunning: false,
  error: null,

  // ── Human input ────────────────────────────────────────
  awaitingHuman: false,
  humanInputText: "",
  _humanResolve: null,

  // ── Actions ────────────────────────────────────────────
  setTopic:        (t) => set({ topic: t }),
  setTotalTurns:   (n) => set({ totalTurns: n }),
  setVoiceEnabled: (v) => set({ voiceEnabled: v }),
  setHumanMode:    (m) => set({ humanMode: m }),

  togglePersona: (idx, maxCount = 5) => {
    const ids = get().selectedPersonaIds;
    if (ids.includes(idx)) {
      if (ids.length <= 2) return;
      set({ selectedPersonaIds: ids.filter(i => i !== idx) });
    } else {
      if (ids.length >= maxCount) return;
      set({ selectedPersonaIds: [...ids, idx] });
    }
  },

  setPersonaOverride: (id, field, value) => set(state => ({
    personaOverrides: {
      ...state.personaOverrides,
      [id]: { ...state.personaOverrides[id], [field]: value }
    }
  })),

  getPersona: (basePersona) => {
    const ov = get().personaOverrides[basePersona.id] || {};
    return { ...basePersona, ...ov };
  },

  setSession:          (id) => set({ sessionId: id }),
  setPhase:            (p)  => set({ phase: p }),
  setError:            (e)  => set({ error: e }),
  setIsRunning:        (v)  => set({ isRunning: v }),
  setIsLoading:        (v)  => set({ isLoading: v }),
  setCurrentSpeaker:   (p)  => set({ currentSpeaker: p }),
  setStreamingText:    (t)  => set({ streamingText: t }),
  appendStreamingText: (c)  => set(s => ({ streamingText: s.streamingText + c })),
  setCurrentTurn:      (n)  => set({ currentTurn: n }),
  pushArgument:        (e)  => set(s => ({ argumentHistory: [...s.argumentHistory, e] })),

  // Human turn flow
  setHumanInputText: (t) => set({ humanInputText: t }),

  beginHumanTurn: () => new Promise(resolve => {
    set({ awaitingHuman: true, humanInputText: "", _humanResolve: resolve });
  }),

  submitHumanInput: () => {
    const { humanInputText, _humanResolve } = get();
    if (!humanInputText.trim() || !_humanResolve) return;
    _humanResolve(humanInputText.trim());
    set({ awaitingHuman: false, humanInputText: "", _humanResolve: null });
  },

  cancelHumanTurn: () => {
    const { _humanResolve } = get();
    if (_humanResolve) _humanResolve("[skipped]");
    set({ awaitingHuman: false, humanInputText: "", _humanResolve: null });
  },

  // Full reset — used when going back to setup from debate page
  resetDebate: () => set({
    sessionId: null, phase: "setup", argumentHistory: [],
    currentTurn: 0, currentSpeaker: null, streamingText: "",
    isLoading: false, isRunning: false, error: null,
    awaitingHuman: false, humanInputText: "", _humanResolve: null,
    // Intentionally NOT resetting: topic, selectedPersonaIds, personaOverrides, humanMode
  }),

  // Runtime-only reset — used when starting a debate (preserves config)
  resetRuntimeOnly: () => set({
    sessionId: null, phase: "setup", argumentHistory: [],
    currentTurn: 0, currentSpeaker: null, streamingText: "",
    isLoading: false, isRunning: false, error: null,
    awaitingHuman: false, humanInputText: "", _humanResolve: null,
  }),
}));
