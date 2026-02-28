// ============================================================
// DEBATE ROUTES
// All endpoints related to debate session management
// ============================================================

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { generateArgument } from "../services/groqService.js";
import { buildSystemPrompt, buildTurnPrompt } from "../services/promptBuilder.js";
import { sessionStore } from "../services/sessionStore.js";

export const debateRouter = Router();

// ── POST /api/debate/start ────────────────────────────────
// Creates a new debate session
// Body: { topic, personas, totalTurns }
// Returns: { sessionId, session }
debateRouter.post("/start", (req, res) => {
  const { topic, personas, totalTurns = 10 } = req.body;

  if (!topic || !personas || personas.length < 2) {
    return res.status(400).json({ error: "topic and at least 2 personas required" });
  }

  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    topic,
    personas,
    totalTurns,
    currentTurn: 0,
    argumentHistory: [],   // ← THE MEMORY — grows each turn
    status: "active",      // active | paused | ended
    createdAt: Date.now(),
  };

  sessionStore.set(sessionId, session);
  console.log(`[Session] Created: ${sessionId} | Topic: "${topic}" | ${personas.length} personas`);

  res.json({ sessionId, session });
});


// ── POST /api/debate/turn ─────────────────────────────────
// Runs ONE debate turn. Streams the response via SSE.
// Body: { sessionId }
// Returns: Server-Sent Events stream
debateRouter.post("/turn", async (req, res) => {
  const { sessionId } = req.body;
  const session = sessionStore.get(sessionId);

  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.status === "ended") return res.status(400).json({ error: "Debate already ended" });
  if (session.currentTurn >= session.totalTurns) {
    session.status = "ended";
    return res.json({ ended: true, session });
  }

  // Who speaks this turn (round-robin)
  const personaIndex = session.currentTurn % session.personas.length;
  const persona = session.personas[personaIndex];
  const lastArg = session.argumentHistory.at(-1) || null;

  const systemPrompt = buildSystemPrompt(persona);
  const userPrompt = buildTurnPrompt(persona, session.topic, session.argumentHistory, lastArg);

  // ── SSE Setup ────────────────────────────────────────────
  // Server-Sent Events lets us stream text word-by-word to the frontend
  // Frontend receives: data: {"type":"chunk","text":"word "}
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  send({ type: "turn_start", persona, turn: session.currentTurn + 1 });

  try {
    let fullText = "";

    await generateArgument(systemPrompt, userPrompt, (chunk) => {
      fullText += chunk;
      send({ type: "chunk", text: chunk });
    });

    // Store completed argument in session memory
    const entry = {
      personaId: persona.id,
      personaName: persona.name,
      ideology: persona.ideology,
      color: persona.color,
      persona,
      summary: fullText.trim(),
      turn: session.currentTurn + 1,
    };

    session.argumentHistory.push(entry);
    session.currentTurn += 1;

    if (session.currentTurn >= session.totalTurns) {
      session.status = "ended";
    }

    sessionStore.set(sessionId, session);
    send({ type: "turn_end", entry, session });
    res.end();

  } catch (err) {
    console.error("[Turn Error]", err.message);
    send({ type: "error", message: err.message });
    res.end();
  }
});


// ── GET /api/debate/session/:id ───────────────────────────
// Returns the current state of a session
debateRouter.get("/session/:id", (req, res) => {
  const session = sessionStore.get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json({ session });
});


// ── DELETE /api/debate/session/:id ───────────────────────
// Ends and cleans up a session
debateRouter.delete("/session/:id", (req, res) => {
  sessionStore.delete(req.params.id);
  res.json({ deleted: true });
});
