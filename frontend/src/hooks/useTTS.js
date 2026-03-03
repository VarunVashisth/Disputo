

import { useCallback } from "react";
import { PERSONAS } from "../store/personas";

export function useTTS(voiceEnabled) {

  // Ensure voices are loaded
  if (typeof window !== "undefined") {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
  
  const speak = useCallback((text, persona) => {
    return new Promise((resolve) => {
  
      if (!voiceEnabled || !window.speechSynthesis || !persona) {
        resolve();
        return;
      }
  
      // 🔕 Skip human
      if (persona.type === "human") {
        resolve();
        return;
      }
  
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
  
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.pitch = 0.88;
      utterance.rate  = 0.9;
  
      const voices = window.speechSynthesis.getVoices();
  
      let selectedVoice = null;
  
      // Assign voice based on persona.id
      if (persona.id === 0) {
        selectedVoice = voices.find(v => v.name === "Google UK English Male");
      }
  
      else if (persona.id === 1) {
        selectedVoice = voices.find(v => v.name === "Microsoft Ravi - English (India)");
      }
  
      else if (persona.id === 2) {
        selectedVoice = voices.find(v => v.name.includes("Male") && v.lang.startsWith("en"));
      }
  
      else if (persona.id === 3) {
        selectedVoice = voices.find(v => v.name === "Microsoft Ravi - English (India)");
      }
  
      // Fallback safety
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith("en"));
      }
  
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
  
      utterance.onend = resolve;
      utterance.onerror = resolve;
  
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 80);
  
    });
  }, [voiceEnabled]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, cancel };
}