import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { generateArgument } from "../services/groqService.js";
import { buildSystemPrompt, buildTurnPrompt } from "../services/promptBuilder.js";
import { sessionStore } from "../services/sessionStore.js";

export const debateRouter = Router();

// POST /api/debate/start
debateRouter.post("/start", (req, res) => {
  const { topic, personas, totalTurns = 10 } = req.body;
  if (!topic || !personas || personas.length < 1)
    return res.status(400).json({ error: "topic and at least 1 AI persona required" });

  const session = {
    id: uuidv4(), topic, personas, totalTurns,
    currentTurn: 0, argumentHistory: [], status: "active", createdAt: Date.now(),
  };
  sessionStore.set(session.id, session);
  console.log(`[Session] ${session.id} | "${topic}" | ${personas.length} personas`);
  res.json({ sessionId: session.id, session });
});


debateRouter.post("/tts", async (req, res) => {
  try {
    const { text, voiceId } = req.body;

    if (!text || !voiceId) {
      return res.status(400).json({ error: "Missing text or voiceId" });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("Missing ELEVENLABS_API_KEY");
      return res.status(500).json({ error: "Server misconfigured" });
    }

    const resp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.3,
          },
        }),
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("ElevenLabs error:", errorText);
      return res.status(500).json({ error: "TTS failed" });
    }

    const buf = await resp.arrayBuffer();

    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(buf));

  } catch (err) {
    console.error("TTS route crashed:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// POST /api/debate/turn  — AI speaks
debateRouter.post("/turn", async (req, res) => {
  const { sessionId } = req.body;
  const session = sessionStore.get(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.status === "ended") return res.status(400).json({ error: "Debate ended" });

  // Round-robin over AI personas only
  const personaIndex = session.currentTurn % session.personas.length;
  const persona = session.personas[personaIndex];
  const lastArg = session.argumentHistory.at(-1) || null;

  const systemPrompt = buildSystemPrompt(persona);
  const userPrompt   = buildTurnPrompt(persona, session.topic, session.argumentHistory, lastArg);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const send = obj => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  send({ type: "turn_start", persona, turn: session.currentTurn + 1 });

  try {
    let fullText = "";
    await generateArgument(systemPrompt, userPrompt, chunk => {
      fullText += chunk;
      send({ type: "chunk", text: chunk });
    });

    const entry = {
      personaId: persona.id, personaName: persona.name, ideology: persona.ideology,
      color: persona.color, persona, summary: fullText.trim(),
      turn: session.currentTurn + 1,
    };

    session.argumentHistory.push(entry);
    session.currentTurn += 1;
    if (session.currentTurn >= session.totalTurns) session.status = "ended";
    sessionStore.set(sessionId, session);
    send({ type: "turn_end", entry, session });
    res.end();
  } catch (err) {
    console.error("[Turn Error]", err.message);
    send({ type: "error", message: err.message });
    res.end();
  }
});

// POST /api/debate/inject  — Human's turn pushed into session memory
debateRouter.post("/inject", (req, res) => {
  const { sessionId, entry } = req.body;
  const session = sessionStore.get(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });

  // Add to history without advancing the AI turn counter
  session.argumentHistory.push({ ...entry, injected: true });
  sessionStore.set(sessionId, session);
  res.json({ ok: true });
});

debateRouter.get("/session/:id", (req, res) => {
  const s = sessionStore.get(req.params.id);
  if (!s) return res.status(404).json({ error: "Not found" });
  res.json({ session: s });
});

debateRouter.delete("/session/:id", (req, res) => {
  sessionStore.delete(req.params.id);
  res.json({ deleted: true });
});
