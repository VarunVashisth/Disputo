// ============================================================
// PROMPT BUILDER
// Central place for all prompt engineering.
// Changing prompts here changes debate quality across the app.
// ============================================================

// ── buildSystemPrompt ─────────────────────────────────────
// Defines WHO this AI persona IS.
// This is sent as the "system" role — the AI's identity.
export function buildSystemPrompt(persona) {
  return `You are ${persona.name}, a debater representing the ${persona.ideology} worldview.
Your debate personality: ${persona.style}

STRICT RULES you must follow at all times:
1. Never break character. Never say "As an AI" or acknowledge you are an AI.
2. Every response must be exactly 2-4 sentences. Sharp, punchy, no fluff.
3. Make exactly ONE strong argument or counterpoint per turn.
4. Argue with intellectual conviction. Back points with logic or real-world reasoning.
5. Directly challenge what the previous speaker said when relevant.
6. Never start with "Great point", "I agree", or any filler phrase. Lead with your argument.
7. Speak as ${persona.name} would — use their voice, rhythm, and framing.`;
}


// ── buildTurnPrompt ───────────────────────────────────────
// Defines WHAT to say this turn.
// Injects the FULL argument history so the AI cannot repeat points.
// This is the core anti-repetition mechanism.
export function buildTurnPrompt(persona, topic, history, lastArg) {
  const historySection = history.length === 0
    ? "No arguments have been made yet. You are opening the debate — make a strong first statement."
    : `FULL DEBATE HISTORY (every argument made so far — you MUST NOT repeat any of these):\n${
        history.map((h, i) =>
          `  [Turn ${i + 1}] ${h.personaName} (${h.ideology}): ${h.summary}`
        ).join("\n")
      }`;

  const lastContext = lastArg && history.length > 0
    ? `\nThe MOST RECENT argument (address this if you can):\n  → ${lastArg.personaName}: "${lastArg.summary}"`
    : "";

  return `DEBATE TOPIC: "${topic}"

${historySection}${lastContext}

Now it is YOUR turn as ${persona.name} (${persona.ideology}).

Instructions:
- Make a GENUINELY NEW argument not already made above
- If responding to the last speaker, directly challenge their specific claim
- 2-4 sentences only. No preamble. Start immediately with your argument.`;
}
