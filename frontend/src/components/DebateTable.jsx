

import React, { useEffect, useRef } from "react";

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    // Only set crossOrigin for external URLs
    if (url.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function createNoiseBuffer(W, H) {
  const off = document.createElement("canvas");
  off.width = W; off.height = H;
  const oc = off.getContext("2d");
  const id = oc.createImageData(W, H);
  const d  = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 22 | 0;
    d[i] = d[i+1] = d[i+2] = v;
    d[i+3] = 26;
  }
  oc.putImageData(id, 0, 0);
  return off;
}

function homeRatios(n) {
  if (n === 1) return [0.50];
  if (n === 2) return [0.22, 0.78];
  if (n === 3) return [0.16, 0.50, 0.84];
  return            [0.12, 0.36, 0.64, 0.88];
}

function drawPersonaImage(ctx, img, figX, figY, figW, figH, alpha, dimmed) {
  ctx.save();
  ctx.globalAlpha = alpha;

  if (img) {
    // Rounded-top clip
    const r = figW * 0.05;
    ctx.beginPath();
    ctx.moveTo(figX + r, figY);
    ctx.lineTo(figX + figW - r, figY);
    ctx.arcTo(figX + figW, figY,          figX + figW, figY + r,   r);
    ctx.lineTo(figX + figW, figY + figH);
    ctx.lineTo(figX,        figY + figH);
    ctx.arcTo(figX,         figY,          figX + r,   figY,       r);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, figX, figY, figW, figH);

    // Desaturate inactive personas
    if (dimmed) {
      ctx.globalCompositeOperation = "saturation";
      ctx.globalAlpha = 0.95;
      ctx.fillStyle   = "hsl(0,0%,16%)";
      ctx.fillRect(figX, figY, figW, figH);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha;
    }

    // Cinematic darken gradient — void emergence
    const dk = ctx.createLinearGradient(figX, figY, figX, figY + figH);
    dk.addColorStop(0,    "rgba(5,4,3,0.65)");
    dk.addColorStop(0.20, "rgba(5,4,3,0.06)");
    dk.addColorStop(0.65, "rgba(5,4,3,0.16)");
    dk.addColorStop(1,    "rgba(5,4,3,0.90)");
    ctx.fillStyle = dk;
    ctx.fillRect(figX, figY, figW, figH);

  } else {
    // Silhouette fallback
    ctx.fillStyle = "#0e0c0a";
    ctx.fillRect(figX, figY, figW, figH);
    ctx.beginPath();
    ctx.arc(figX + figW*0.5, figY + figH*0.22, figW*0.17, 0, Math.PI*2);
    ctx.fillStyle = "#161310"; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(figX + figW*0.5, figY + figH*0.50, figW*0.32, figH*0.17, 0, 0, Math.PI*2);
    ctx.fillStyle = "#161310"; ctx.fill();
  }

  ctx.restore();
}

function drawGlow(ctx, figX, figY, figW, figH, colorHex, t) {
  const pulse = 0.50 + Math.sin(t * 3.0) * 0.08;
  const [r,g,b] = hexToRgb(colorHex);
  const glow = (a) => `rgba(${r},${g},${b},${(a * pulse).toFixed(3)})`;

  // Left rim
  const lg = ctx.createLinearGradient(figX - figW*0.20, 0, figX + figW*0.24, 0);
  lg.addColorStop(0, glow(0.44)); lg.addColorStop(1, glow(0));
  ctx.fillStyle = lg;
  ctx.fillRect(figX - figW*0.20, figY, figW*0.44, figH);

  // Right rim
  const rg = ctx.createLinearGradient(figX + figW*0.76, 0, figX + figW*1.20, 0);
  rg.addColorStop(0, glow(0)); rg.addColorStop(1, glow(0.44));
  ctx.fillStyle = rg;
  ctx.fillRect(figX + figW*0.60, figY, figW*0.60, figH);

  // Top halo above head
  const tg = ctx.createRadialGradient(
    figX + figW*0.5, figY - figH*0.04, 0,
    figX + figW*0.5, figY - figH*0.04, figW*0.68
  );
  tg.addColorStop(0, glow(0.20)); tg.addColorStop(1, glow(0));
  ctx.fillStyle = tg;
  ctx.fillRect(figX - figW*0.18, figY - figH*0.10, figW*1.36, figH*0.40);

  // Floor puddle
  const fg = ctx.createRadialGradient(
    figX + figW*0.5, figY + figH, 0,
    figX + figW*0.5, figY + figH, figW*0.75
  );
  fg.addColorStop(0, glow(0.22)); fg.addColorStop(1, glow(0));
  ctx.fillStyle = fg;
  ctx.fillRect(figX - figW*0.25, figY + figH*0.75, figW*1.50, figH*0.36);
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W*0.5,H*0.40,H*0.10, W*0.5,H*0.40,H*0.82);
  g.addColorStop(0,    "rgba(0,0,0,0)");
  g.addColorStop(0.52, "rgba(0,0,0,0.26)");
  g.addColorStop(1,    "rgba(0,0,0,0.92)");
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
}

function drawGrain(ctx, W, H, noise) {
  if (!noise) return;
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.18;
  ctx.drawImage(noise, 0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

function drawScanlines(ctx, W, H) {
  ctx.globalAlpha = 0.028;
  ctx.fillStyle   = "#000";
  for (let y = 0; y < H; y += 5) ctx.fillRect(0, y, W, 1);
  ctx.globalAlpha = 1;
}

function drawGlitch(ctx, W, H, intensity) {
  const snap = ctx.getImageData(0, 0, W, H);
  const tmp  = document.createElement("canvas");
  tmp.width = W; tmp.height = H;
  tmp.getContext("2d").putImageData(snap, 0, 0);

  const slices = Math.random() < 0.4 ? 2 : 1;
  for (let i = 0; i < slices; i++) {
    const sy = Math.random() * H;
    const sh = Math.random() * (H * 0.016) + 1;
    const dx = (Math.random() - 0.5) * intensity * W * 0.036;
    ctx.drawImage(tmp, 0, sy, W, sh, dx, sy, W, sh);
  }
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = intensity * 0.09;
  ctx.drawImage(tmp,  intensity * W * 0.005,  0);
  ctx.globalAlpha = intensity * 0.06;
  ctx.drawImage(tmp, -intensity * W * 0.003,  0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  if (Math.random() < 0.016 * intensity) {
    ctx.globalAlpha = 0.07;
    ctx.fillStyle   = "#fff";
    ctx.fillRect(
      Math.random()*W*0.7, Math.random()*H*0.7,
      Math.random()*52+6,  Math.random()*5+1
    );
    ctx.globalAlpha = 1;
  }
}


function render(canvas, s, personas, noise) {
  const ctx = canvas.getContext("2d");
  const W   = canvas.width;
  const H   = canvas.height;

  s.t += 0.016;
  const t = s.t;

  // Tension
  s.tension += ((s.currentSpeaker ? 1 : 0) - s.tension) * 0.022;

  // Glitch trigger
  s.glitchCD -= 0.016;
  if (s.currentSpeaker && s.glitchCD <= 0 && Math.random() < 0.025) {
    s.glitch   = 0.28 + Math.random() * 0.40;
    s.glitchCD = 0.14 + Math.random() * 0.22;
  }
  s.glitch = (s.glitch || 0) * 0.74;

  // Clear
  ctx.fillStyle = "#050403";
  ctx.fillRect(0, 0, W, H);

  // Floor atmosphere
  const floorG = ctx.createLinearGradient(0, H*0.70, 0, H);
  floorG.addColorStop(0, "rgba(0,0,0,0)");
  floorG.addColorStop(1, "rgba(18,14,10,0.50)");
  ctx.fillStyle = floorG;
  ctx.fillRect(0, 0, W, H);

  const n     = personas.length;
  const homes = homeRatios(n);   // resting X ratios

  // Update animated X for each persona
  // Speaking persona lerps toward 0.5 (centre)
  // Others lerp back to their home position
  personas.forEach((persona, i) => {
    const speaking = s.currentSpeaker?.id === persona.id;
    const targetX  = speaking ? 0.50 : homes[i];
    s.personaX[i]  = (s.personaX[i] ?? homes[i]) + (targetX - (s.personaX[i] ?? homes[i])) * 0.055;
  });

  // Draw order: inactive behind, speaker on top
  const order = [...Array(n).keys()].sort((a, b) => {
    const aS = s.currentSpeaker?.id === personas[a].id;
    const bS = s.currentSpeaker?.id === personas[b].id;
    return (aS ? 1 : 0) - (bS ? 1 : 0);
  });

  order.forEach(i => {
    const persona  = personas[i];
    const img      = s.images?.[i] || null;
    const speaking = s.currentSpeaker?.id === persona.id;
    const dimmed   = s.isRunning && !speaking;

    // ── Height: speaking = 80% canvas, seat = 62%, idle = 68%
    const targetH = speaking
      ? H * 0.80
      : dimmed ? H * 0.58 : H * 0.66;
    s.personaH[i] = (s.personaH[i] ?? H*0.66) + (targetH - (s.personaH[i] ?? H*0.66)) * 0.055;
    const figH = s.personaH[i];

    // Aspect ratio from image, fallback 0.55
    const ar   = img ? (img.naturalWidth / img.naturalHeight) : 0.55;
    const figW = figH * ar;

    // X from animated position (centre of figure)
    const centreX = W * s.personaX[i];
    const figX    = centreX - figW * 0.5;

    // Anchor bottom at 86% H
    const figY = H * 0.86 - figH;

    // Breathing — only when not animating toward centre
    const breathe = Math.sin(t * 0.50 + i * 1.35) * (H * 0.0025);

    // Opacity
    const targetAlpha = speaking ? 1.0 : dimmed ? 0.24 : 0.70;
    s.personaAlpha[i] = (s.personaAlpha[i] ?? 0.70) + (targetAlpha - (s.personaAlpha[i] ?? 0.70)) * 0.050;

    // Micro inward lean for speaker
    ctx.save();
    if (speaking && s.tension > 0.1) {
      const cx = centreX;
      const cy = figY + figH;
      // Lean direction: left-side personas lean right, right-side lean left
      const leanDir = homes[i] < 0.5 ? 1 : -1;
      ctx.translate(cx, cy);
      ctx.rotate(leanDir * 0.010 * s.tension);
      ctx.translate(-cx, -cy);
    }

    drawPersonaImage(ctx, img, figX, figY + breathe, figW, figH, s.personaAlpha[i], dimmed);
    ctx.restore();

    // Glow outside of transform
    if (speaking) {
      drawGlow(ctx, figX, figY + breathe, figW, figH, persona.color, t);
    }
  });

  // Table line
  const tableY = H * 0.868;
  const tg = ctx.createLinearGradient(0,0,W,0);
  tg.addColorStop(0,   "rgba(30,24,18,0)");
  tg.addColorStop(0.2, "rgba(42,34,22,0.52)");
  tg.addColorStop(0.5, "rgba(52,42,28,0.68)");
  tg.addColorStop(0.8, "rgba(42,34,22,0.52)");
  tg.addColorStop(1,   "rgba(30,24,18,0)");
  ctx.strokeStyle = tg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W*0.04, tableY); ctx.lineTo(W*0.96, tableY);
  ctx.stroke();

  // Overlays
  drawVignette(ctx, W, H);
  drawGrain(ctx, W, H, noise);
  drawScanlines(ctx, W, H);
  if (s.glitch > 0.015) drawGlitch(ctx, W, H, s.glitch);
}


export function DebateTable({ personas, currentSpeaker, isRunning, streamingText }) {
  const canvasRef = useRef(null);
  const noiseRef  = useRef(null);

  const live = useRef({
    currentSpeaker: null,
    isRunning:      false,
    t:              0,
    glitch:         0,
    glitchCD:       0,
    tension:        0,
    images:         [],
    personaX:       [],   // animated X ratio per persona (0–1)
    personaH:       [],   // animated height per persona (px)
    personaAlpha:   [],
  });

  live.current.currentSpeaker = currentSpeaker;
  live.current.isRunning      = isRunning;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true, raf;

    const homes = homeRatios(personas.length);

    // Reset animated state
    live.current.personaX     = homes.slice();
    live.current.personaH     = personas.map(() => 0);
    live.current.personaAlpha = personas.map(() => 0.70);
    live.current.images       = [];
    live.current.t            = 0;
    live.current.glitch       = 0;
    live.current.tension      = 0;

    function sizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = (canvas.offsetWidth  || 700) * dpr;
      canvas.height = (canvas.offsetHeight || 420) * dpr;
      noiseRef.current = createNoiseBuffer(canvas.width, canvas.height);
      // Re-seed personaH in pixel terms after resize
      live.current.personaH = personas.map(() => canvas.height * 0.66);
    }
    sizeCanvas();

    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(canvas.parentElement || canvas);

    Promise.all(personas.map(p => loadImage(p.imageUrl))).then(images => {
      if (!alive) return;
      live.current.images = images;
      function loop() {
        if (!alive) return;
        raf = requestAnimationFrame(loop);
        render(canvas, live.current, personas, noiseRef.current);
      }
      loop();
    });

    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personas.map(p => p.id).join(",")]);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      overflow: "hidden", background: "#050403", minHeight: 360,
    }}>
      <canvas ref={canvasRef} style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        zIndex: 1, display: "block",
      }} />

      {/* Subtitle */}
      {streamingText && currentSpeaker && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
          background: "linear-gradient(transparent, rgba(3,2,2,0.97) 30%)",
          padding: "34px 32px 18px",
          borderTop: `1px solid ${currentSpeaker.color}18`,
        }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(13px,1.55vw,15px)",
            color: "rgba(237,232,223,0.90)",
            fontStyle: "italic", lineHeight: 1.72, margin: 0,
            letterSpacing: "0.012em",
            textShadow: `0 0 30px ${currentSpeaker.color}30`,
          }}>
            {streamingText}
            <span style={{ animation:"blink 0.75s step-end infinite", marginLeft:3, opacity:0.65 }}>▌</span>
          </p>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: 5,
            color: currentSpeaker.color, marginTop: 9, opacity: 0.60,
            textTransform: "uppercase",
          }}>
            {currentSpeaker.name} · {currentSpeaker.ideology}
          </p>
        </div>
      )}

      {/* Name plates */}
      <div style={{
        position: "absolute",
        bottom: (streamingText && currentSpeaker) ? 114 : 14,
        left: 0, right: 0, display: "flex", justifyContent: "center",
        gap: 28, zIndex: 8, padding: "0 16px",
        transition: "bottom 0.5s ease",
      }}>
        {personas.map(p => {
          const sp = currentSpeaker?.id === p.id;
          const dm = isRunning && !sp;
          return (
            <span key={p.id} style={{
              fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: 4,
              color:   sp ? p.color : dm ? "#161412" : "#2a2520",
              opacity: sp ? 0.78    : dm ? 0.32      : 0.50,
              textShadow: sp ? `0 0 14px ${p.color}50` : "none",
              transition: "color 0.8s, opacity 0.8s, text-shadow 0.8s",
            }}>
              {p.isHuman ? "▶ " : ""}{p.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
