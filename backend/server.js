// ============================================================
// AI DEBATE SIMULATOR — BACKEND SERVER
// Stack: Node.js + Express + Groq SDK
// Architecture:
//   • /api/debate/start   → creates a new session in memory
//   • /api/debate/turn    → runs ONE AI turn (SSE streamed)
//   • /api/debate/session → returns full session state
//   • Sessions stored in-memory Map (replace with Redis later)
// ============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { debateRouter } from "./routes/debate.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ────────────────────────────────────────────
// Allow ALL origins in dev — no CORS issues
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── ROUTES ────────────────────────────────────────────────
app.use("/api/debate", debateRouter);

// Root — so browser doesn't show "cannot GET /"
app.get("/", (_req, res) => {
  res.json({
    name: "AI Debate Simulator API",
    status: "running",
    groqKey: process.env.GROQ_API_KEY ? "✅ loaded" : "❌ missing — add GROQ_API_KEY to .env",
    endpoints: {
      health:  "GET  /api/health",
      start:   "POST /api/debate/start",
      turn:    "POST /api/debate/turn",
      session: "GET  /api/debate/session/:id",
    },
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    groqKey: process.env.GROQ_API_KEY ? "loaded" : "MISSING",
    timestamp: new Date().toISOString(),
  });
});

// ── ERROR HANDLER ─────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🎤 Debate Simulator Backend`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Groq key: ${process.env.GROQ_API_KEY ? "✅ found" : "❌ missing — set GROQ_API_KEY in .env"}\n`);
});
