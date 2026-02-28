// ============================================================
// useTTS — Text-to-Speech Hook
// Wraps Web Speech API. Each persona has unique pitch+rate.
// Returns a speak() function that resolves when speech ends.
// ============================================================

import { useCallback } from "react";

export function useTTS(voiceEnabled) {
  const speak = useCallback((text, persona) => {
    return new Promise((resolve) => {
      if (!voiceEnabled || !window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = persona.voice.pitch;
      utterance.rate  = persona.voice.rate;
      utterance.lang  = persona.voice.lang;

      // Pick a matching voice from the browser's voice list
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v =>
        v.lang.startsWith(persona.voice.lang.slice(0, 2)) && !v.name.includes("Google")
      ) || voices.find(v => v.lang.startsWith("en"));

      if (match) utterance.voice = match;

      utterance.onend   = resolve;
      utterance.onerror = resolve;

      window.speechSynthesis.speak(utterance);
    });
  }, [voiceEnabled]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, cancel };
}
