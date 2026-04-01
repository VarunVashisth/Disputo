#  AI Debate Simulator — Disputo

> Multi-Persona intellectual debate engine. Black & white grungy aesthetic.
> Powered by Groq + Llama 3.3 (free). 

---

## Installation

### 1. Get a free Groq API key
Go to https://console.groq.com → sign up → copy your API key.
It's completely free. 

### 2. Start the backend
```bash
cd backend
npm install
cp .env.example .env
# Open .env and paste your GROQ_API_KEY
npm run dev
# → Running on http://localhost:3001
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

Open http://localhost:5173 — you're live.

---

## Project Structure

```
debate-mvp/
├── backend/
│   ├── server.js                  ← Express app entry point
│   ├── routes/
│   │   └── debate.js              ← All API endpoints
│   ├── services/
│   │   ├── groqService.js         ← Groq SDK + streaming
│   │   ├── promptBuilder.js       ← All prompt engineering
│   │   └── sessionStore.js        ← In-memory session map
│   └── middleware/
│       └── errorHandler.js        ← Global error handler
│
└── frontend/
    ├── index.html                 ← HTML entry + Google Fonts
    ├── vite.config.js             ← Vite + API proxy to :3001
    └── src/
        ├── App.jsx                ← Routing (React Router)
        ├── main.jsx               ← ReactDOM entry point
        ├── styles/
        │   └── global.css         ← Theme, cursor, animations
        ├── store/
        │   ├── debateStore.js     ← Zustand global state
        │   └── personas.js        ← Persona definitions
        ├── hooks/
        │   ├── useCursor.js       ← Custom cursor behavior
        │   ├── useTTS.js          ← Web Speech API wrapper
        │   └── useDebate.js       ← Debate orchestration loop
        ├── components/
        │   ├── PersonaAvatar.jsx  ← Animated silhouette avatars
        │   ├── DebateTable.jsx    ← Visual debate room
        │   └── ArgumentFeed.jsx   ← Live streaming argument list
        └── pages/
            ├── SetupPage.jsx      ← Topic + persona + settings
            └── DebatePage.jsx     ← Live debate room
```

---

## Architecture Guide

### How a debate works, end to end

```
User submits topic + personas
         ↓
POST /api/debate/start
  → Creates session object in memory
  → Returns sessionId
         ↓
useDebate hook starts loop (0 to totalTurns)
         ↓
For each turn:
  POST /api/debate/turn { sessionId }
    ↓
    Backend picks persona (turnIndex % personas.length)
    Builds system prompt  → "You are Aria, a Libertarian..."
    Builds user prompt    → topic + ALL past arguments injected
    Calls Groq API (streaming)
    ↓ SSE chunks stream back to frontend
    Frontend: appendStreamingText(chunk) → live text appears
    ↓
    Turn complete:
    pushArgument(entry) → stored in argumentHistory
    setStreamingText("") → clears live stream
    speak(text, persona) → Web Speech API voices it
    ↓
  700ms pause
  Next turn begins
         ↓
After totalTurns:
  phase = "ended"
  Export available
```

---

### 1. Argument Memory (Anti-Repetition System)

This is the core of what makes debates feel real. Every argument ever made is stored in `session.argumentHistory[]`. Before each API call, this entire list is injected into the prompt:

```javascript
// promptBuilder.js
const historySection = history.map((h, i) =>
  `[Turn ${i+1}] ${h.personaName} (${h.ideology}): ${h.summary}`
).join("\n");

// Then the AI is told:
"You MUST NOT repeat or rephrase any of these arguments."
```

This prevents the AI from recycling points. Each turn builds on all previous turns.

---

### 2. Server-Sent Events (SSE) Streaming

Instead of waiting 3+ seconds for a full response, the frontend receives text word-by-word as Groq generates it. Here's how:

**Backend:**
```javascript
// Sets headers for SSE
res.setHeader("Content-Type", "text/event-stream");

// Sends each Groq chunk as a JSON event
const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

// Groq streaming loop
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content || "";
  send({ type: "chunk", text });
}
```

**Frontend:**
```javascript
// Reads the SSE stream
const reader = res.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  const lines = decoder.decode(value).split("\n");
  for (const line of lines) {
    const event = JSON.parse(line.slice(6)); // strip "data: "
    if (event.type === "chunk") store.appendStreamingText(event.text);
  }
}
```

---

### 3. Turn Manager

The simplest possible design — round-robin using modulo:

```javascript
// backend/routes/debate.js
const personaIndex = session.currentTurn % session.personas.length;
const persona = session.personas[personaIndex];
```

Turn 0 → Persona 0, Turn 1 → Persona 1, Turn 2 → Persona 0, ...

To upgrade to dynamic (smarter) turn management later, replace this with:
- Who was directly challenged?
- Who hasn't spoken in a while?
- Which persona would have the strongest counter?

---

### 4. Session State (In-Memory)

```javascript
// What a session looks like in memory
{
  id: "uuid-v4",
  topic: "Should AI be regulated?",
  personas: [{ id: 0, name: "ARIA", ideology: "Libertarian", ... }],
  totalTurns: 8,
  currentTurn: 3,              // which turn we're on
  argumentHistory: [           // grows each turn
    { personaName: "ARIA", ideology: "Libertarian", summary: "...", turn: 1 },
    { personaName: "MARX", ideology: "Socialist",   summary: "...", turn: 2 },
  ],
  status: "active",            // active | ended
  createdAt: 1718000000000,
}
```

Sessions auto-expire after 2 hours. For production: swap `sessionStore.js` for Redis.

---

### 5. Zustand Store (Frontend State)

All UI state lives in one Zustand store. Components just read from it:

```javascript
// Any component
const { argumentHistory, currentSpeaker, isRunning } = useDebateStore();

// Any action
useDebateStore.getState().pushArgument(entry);
useDebateStore.getState().setPhase("ended");
```

No prop drilling. No Context API boilerplate.

---

### 6. Custom Cursor System

The cursor changes color based on what you hover:

```javascript
// useCursor.js
const onMouseOver = (e) => {
  const el = e.target.closest("[data-accent]");
  if (el) {
    trail.style.borderColor = el.dataset.accent; // uses persona color
    cursor.style.background = el.dataset.accent;
  }
};
```

Add `data-accent="#4fffb0"` to any element to make the cursor glow that color on hover.
The cursor ring smoothly lags behind the dot using `lerp` in a requestAnimationFrame loop.

---

### 7. Visual Avatars

Each persona has a unique SVG silhouette (circle/square/triangle/diamond head shape).
At rest: grayscale, dim, no glow.
Speaking: full color, glow, animation.

```jsx
// PersonaAvatar.jsx
filter: isDimmed
  ? "brightness(0.35) saturate(0)"  // gray out non-speakers
  : isSpeaking
  ? "brightness(1.1)"               // bright + colorful for speaker
  : "brightness(0.7) saturate(0)"   // dim when idle
```

The spinning gradient ring around the avatar is CSS `conic-gradient` animated with `animation: spin`:
```css
background: conic-gradient(${color}, transparent, ${color});
animation: spin 3s linear infinite;
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--black` | `#0a0a0a` | Background |
| `--white` | `#f0ece4` | Text, buttons |
| `--gray-700` | `#2a2a2a` | Borders |
| `--accent-1` | `#4fffb0` | Aria (mint) |
| `--accent-2` | `#ff4f4f` | Marx (red) |
| `--accent-3` | `#4fb8ff` | Sage (blue) |
| `--accent-4` | `#ffd24f` | Nova (amber) |

**Fonts:**
- `Bebas Neue` — Display/headings (all-caps impact)
- `DM Mono` — UI labels, metadata, code
- `Playfair Display` — Body, arguments (editorial feel)

**Grungy effects:**
- Noise texture via inline SVG `feTurbulence` on `body::before`
- Scanlines via `repeating-linear-gradient` on left panel
- Glitch animation: CSS `clip-path` alternating on `::before` / `::after`

---

## 💸 Cost Breakdown

| Service | Free Tier | When you'd hit limit |
|---------|-----------|---------------------|
| Groq API | ~14,400 tokens/min | ~100+ debates/hour |
| Vercel (frontend) | 100GB bandwidth | Thousands of users |
| Railway (backend) | $5 credit/month | Light usage |
| Supabase (future DB) | 500MB, 2GB transfer | Hundreds of saved debates |

**Total monthly cost at MVP stage: ₹0**

---

## 🔜 What to Build Next

1. **Audience Mode** — User can type a question mid-debate and inject it as a turn
2. **Historical Figures** — Pre-built personas (Einstein, Gandhi, Nietzsche)
3. **Debate Summary** — Final AI summary of strongest arguments made
4. **Save & Share** — Persist debates to Supabase, generate shareable links
5. **ElevenLabs TTS** — Better voices (use free 10k chars/month for demos)
6. **Referee Persona** — Fact-checks claims as they're made

---

## 📜 License

MIT — free to use, modify, and build on.
