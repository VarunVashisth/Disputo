// ============================================================
// PersonaAvatar — Grungy Faceless Human Figures
// Real human seated silhouette, NO face (blank/void head).
// Grungy ink-print texture via canvas overlay.
// B&W + texture at rest → color bleed + glow when speaking.
// ============================================================

import React, { useEffect, useRef } from "react";

// ── Texture Canvas Overlay ────────────────────────────────
function TextureOverlay({ color, isSpeaking, size }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = size, H = size;
    canvas.width = W;
    canvas.height = H;

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    let frame = 0;

    function draw() {
      frame++;
      ctx.clearRect(0, 0, W, H);

      if (isSpeaking) {
        const doGlitch = Math.random() > 0.6;
        const glAmt = doGlitch ? (Math.random() - 0.5) * 5 : 0;
        ctx.fillStyle = `rgba(${r},0,0,0.10)`; ctx.fillRect(glAmt * 2, 0, W, H);
        ctx.fillStyle = `rgba(0,0,${b},0.08)`;  ctx.fillRect(-glAmt, 0, W, H);
        const pulse = 0.07 + Math.sin(frame * 0.14) * 0.04;
        ctx.fillStyle = `rgba(${r},${g},${b},${pulse})`; ctx.fillRect(0, 0, W, H);
        if (doGlitch && Math.random() > 0.55) {
          const sy = Math.random() * H, sh = Math.random() * 9 + 2, sx = (Math.random() - 0.5) * 10;
          ctx.save(); ctx.globalAlpha = 0.65;
          ctx.drawImage(canvas, 0, sy, W, sh, sx, sy, W, sh);
          ctx.restore();
        }
      }

      const imageData = ctx.getImageData(0, 0, W, H);
      const data = imageData.data;
      const grainAmt = isSpeaking ? 16 : 26;
      for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * grainAmt;
        data[i]   = Math.min(255, Math.max(0, data[i]   + grain));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + grain));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + grain));
      }
      ctx.putImageData(imageData, 0, 0);

      ctx.fillStyle = "rgba(0,0,0,0.16)";
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [color, isSpeaking, size]);

  return (
    <canvas ref={canvasRef} width={size} height={size} style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      mixBlendMode: isSpeaking ? "screen" : "overlay", opacity: 0.5,
    }} />
  );
}

// ── Seated Figure Variants ────────────────────────────────
function Figure({ variant, color, isSpeaking, W, H }) {
  const fill     = isSpeaking ? color : "#2a2a2a";
  const fillDark = isSpeaking ? color + "cc" : "#181818";
  const acc      = isSpeaking ? color + "55" : "#121212";

  // chair geometry shared
  const chairW = variant === "square" ? 0.52 : 0.42;
  const chairX = (1 - chairW) / 2;

  // posture offsets per variant
  const lean = variant === "diamond" ? -0.04 : 0;         // torso shift up
  const headScale = variant === "square" ? 1.18 : variant === "triangle" ? 0.88 : 1;
  const bodyW    = variant === "square" ? 0.44 : variant === "triangle" ? 0.26 : 0.32;
  const armW     = variant === "square" ? 0.10 : variant === "triangle" ? 0.06 : 0.08;

  const bodyLeft  = (1 - bodyW) / 2 - 0.02;
  const bodyRight = (1 - bodyW) / 2 + bodyW + 0.02;

  return (
    <g>
      {/* Chair back */}
      <rect x={W * chairX} y={H * 0.50} width={W * chairW} height={H * 0.35} rx="3"
        fill="#0e0e0e" stroke="#1a1a1a" strokeWidth="1" />
      {/* Chair seat */}
      <rect x={W * (chairX - 0.04)} y={H * 0.72} width={W * (chairW + 0.08)} height={H * 0.07} rx="2"
        fill="#111" stroke="#181818" strokeWidth="1" />
      {/* Chair legs */}
      <rect x={W * (chairX - 0.01)} y={H * 0.78} width={W * 0.035} height={H * 0.20} rx="1" fill="#0a0a0a" />
      <rect x={W * (chairX + chairW - 0.025)} y={H * 0.78} width={W * 0.035} height={H * 0.20} rx="1" fill="#0a0a0a" />

      {/* Torso */}
      <path d={`
        M ${W * bodyLeft},${H * (0.72 + lean)}
        Q ${W * (bodyLeft - 0.05)},${H * (0.57 + lean)} ${W * (bodyLeft + 0.04)},${H * (0.48 + lean)}
        L ${W * (bodyRight - 0.04)},${H * (0.48 + lean)}
        Q ${W * (bodyRight + 0.05)},${H * (0.57 + lean)} ${W * bodyRight},${H * (0.72 + lean)}
        Z`}
        fill={fill} style={{ transition: "fill 0.5s" }} />

      {/* Neck */}
      <rect x={W * 0.445} y={H * (0.34 + lean)} width={W * 0.11} height={H * (0.15 + lean * -1)}
        rx="4" fill={fillDark} style={{ transition: "fill 0.5s" }} />

      {/* Head — VOID, no face */}
      <ellipse cx={W * 0.50} cy={H * (0.25 + lean)}
        rx={W * 0.13 * headScale} ry={H * 0.105 * headScale}
        fill={fill} style={{ transition: "fill 0.5s" }} />
      {/* Head inner void */}
      <ellipse cx={W * 0.50} cy={H * (0.24 + lean)}
        rx={W * 0.10 * headScale} ry={H * 0.08 * headScale}
        fill={fillDark} style={{ transition: "fill 0.5s" }} />

      {/* Shoulders */}
      <ellipse cx={W * (bodyLeft + 0.03)} cy={H * (0.495 + lean)}
        rx={W * 0.07} ry={H * 0.038} fill={fill} style={{ transition: "fill 0.5s" }} />
      <ellipse cx={W * (bodyRight - 0.03)} cy={H * (0.495 + lean)}
        rx={W * 0.07} ry={H * 0.038} fill={fill} style={{ transition: "fill 0.5s" }} />

      {/* Left arm */}
      <path d={`M ${W*(bodyLeft+0.02)},${H*(0.54+lean)} Q ${W*0.14},${H*0.62} ${W*0.08},${H*0.73}`}
        fill="none" stroke={fill} strokeWidth={W * armW} strokeLinecap="round"
        style={{ transition: "stroke 0.5s" }} />
      {/* Right arm */}
      <path d={`M ${W*(bodyRight-0.02)},${H*(0.54+lean)} Q ${W*0.86},${H*0.62} ${W*0.92},${H*0.73}`}
        fill="none" stroke={fill} strokeWidth={W * armW} strokeLinecap="round"
        style={{ transition: "stroke 0.5s" }} />

      {/* Ink texture strokes on body */}
      <line x1={W*0.42} y1={H*(0.54+lean)} x2={W*0.40} y2={H*(0.66+lean)} stroke={acc} strokeWidth="1.0" />
      <line x1={W*0.52} y1={H*(0.52+lean)} x2={W*0.54} y2={H*(0.67+lean)} stroke={acc} strokeWidth="0.8" />
      <line x1={W*0.60} y1={H*(0.55+lean)} x2={W*0.62} y2={H*(0.64+lean)} stroke={acc} strokeWidth="0.7" />
    </g>
  );
}

// ── Corner Brackets ───────────────────────────────────────
function CornerBrackets({ color, isSpeaking }) {
  const c = isSpeaking ? color + "bb" : "#1e1e1e";
  const s = 10;
  return (
    <>
      <div style={{ position:"absolute", top:-2, left:-2, width:s, height:s, borderTop:`1px solid ${c}`, borderLeft:`1px solid ${c}`, transition:"border-color 0.5s" }} />
      <div style={{ position:"absolute", top:-2, right:-2, width:s, height:s, borderTop:`1px solid ${c}`, borderRight:`1px solid ${c}`, transition:"border-color 0.5s" }} />
      <div style={{ position:"absolute", bottom:-2, left:-2, width:s, height:s, borderBottom:`1px solid ${c}`, borderLeft:`1px solid ${c}`, transition:"border-color 0.5s" }} />
      <div style={{ position:"absolute", bottom:-2, right:-2, width:s, height:s, borderBottom:`1px solid ${c}`, borderRight:`1px solid ${c}`, transition:"border-color 0.5s" }} />
    </>
  );
}

// ── Wave Bars ─────────────────────────────────────────────
function WaveBars({ color, active }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:20, marginTop:5 }}>
      {[0.6,1,0.7,0.95,0.5,0.8,0.65,0.75].map((del, i) => (
        <div key={i} style={{
          width:2, borderRadius:1,
          background: active ? color : "#242424",
          opacity: active ? 1 : 0.5,
          height: active ? undefined : 2,
          animationName: active ? "waveBar" : "none",
          animationDuration: `${0.32 + del * 0.38}s`,
          animationDelay: `${i * 0.055}s`,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDirection: "alternate",
          transition: "background 0.5s, opacity 0.5s",
        }} />
      ))}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────
export function PersonaAvatar({ persona, isSpeaking, isActive, size = 110, showName = true }) {
  const W = size, H = size;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{
        position:"relative", width:W, height:H,
        animation: isSpeaking ? "avatarSpeak 0.9s ease-in-out infinite alternate" : "avatarIdle 4s ease-in-out infinite",
      }}>
        <CornerBrackets color={persona.color} isSpeaking={isSpeaking} />

        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
          <Figure variant={persona.avatarVariant} color={persona.color} isSpeaking={isSpeaking} W={W} H={H} />
        </svg>

        <TextureOverlay color={persona.color} isSpeaking={isSpeaking} size={size} />

        {isSpeaking && (
          <div style={{
            position:"absolute", inset:-14, borderRadius:4, pointerEvents:"none",
            background:`radial-gradient(ellipse, ${persona.color}1a 0%, transparent 70%)`,
            animation:"speakerGlow 1.1s ease-in-out infinite alternate",
          }} />
        )}

        <div style={{
          position:"absolute", bottom:-1, right:-1,
          fontFamily:"var(--font-mono)", fontSize:7,
          color: isSpeaking ? persona.color : "#262626",
          background:"#080808", padding:"1px 3px",
          transition:"color 0.5s", letterSpacing:1,
        }}>
          {String(persona.id).padStart(2,"0")}
        </div>
      </div>

      {showName && (
        <div style={{ textAlign:"center" }}>
          <div style={{
            fontFamily:"var(--font-display)", fontSize:12, letterSpacing:4,
            color: isSpeaking ? persona.color : "var(--white-dim)",
            transition:"color 0.5s",
          }}>{persona.name}</div>
          <div style={{
            fontFamily:"var(--font-mono)", fontSize:8,
            color: isSpeaking ? persona.color + "99" : "#2c2c2c",
            letterSpacing:1, marginTop:2, transition:"color 0.5s",
          }}>{persona.ideology.toUpperCase()}</div>
        </div>
      )}

      <WaveBars color={persona.color} active={isSpeaking} />
    </div>
  );
}
