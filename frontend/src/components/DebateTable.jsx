// ============================================================
// DebateTable — Cinematic front-facing debate room
// Camera: straight-on, slight perspective tilt on the table
// The table is a geometric frame; avatars sit behind it.
// Scanlines + noise + glitch borders = grungy atmosphere.
// ============================================================

import React from "react";
import { PersonaAvatar } from "./PersonaAvatar.jsx";

// Seat positions for N personas — front-facing camera layout
// All personas visible, seated "around" the table from viewer's POV
function getSeatConfig(count) {
  const configs = {
    2: [
      { x: 0.22, y: 0.42 },
      { x: 0.78, y: 0.42 },
    ],
    3: [
      { x: 0.15, y: 0.48 },
      { x: 0.50, y: 0.22 },
      { x: 0.85, y: 0.48 },
    ],
    4: [
      { x: 0.12, y: 0.50 },
      { x: 0.38, y: 0.18 },
      { x: 0.62, y: 0.18 },
      { x: 0.88, y: 0.50 },
    ],
  };
  return configs[count] || configs[4];
}

// ── Glitch border line ────────────────────────────────────
function GlitchLine({ x1, y1, x2, y2, color, active }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={active ? color : "#1c1c1c"}
      strokeWidth={active ? "1.5" : "1"}
      strokeDasharray={active ? "4 2" : "2 6"}
      opacity={active ? 0.7 : 1}
      style={{ transition: "stroke 0.5s, stroke-width 0.3s" }}
    />
  );
}

// ── Table SVG surface ─────────────────────────────────────
function TableSVG({ W, H, currentSpeaker }) {
  const cx = W / 2;
  const tableY = H * 0.68;
  const tableW = W * 0.78;
  const tableH = H * 0.10;
  const active = !!currentSpeaker;
  const color = currentSpeaker?.color || "#333";

  return (
    <svg
      width={W} height={H}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id="tableTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
        <linearGradient id="tableFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#111" />
          <stop offset="100%" stopColor="#080808" />
        </linearGradient>
        <filter id="tableBlur">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Drop shadow */}
      <ellipse
        cx={cx} cy={tableY + tableH + 10}
        rx={tableW * 0.45} ry={12}
        fill="rgba(0,0,0,0.7)"
        filter="url(#tableBlur)"
      />

      {/* Table top surface (trapezoid — perspective) */}
      <polygon
        points={`
          ${cx - tableW * 0.44},${tableY}
          ${cx + tableW * 0.44},${tableY}
          ${cx + tableW * 0.50},${tableY + tableH}
          ${cx - tableW * 0.50},${tableY + tableH}
        `}
        fill="url(#tableTopGrad)"
        stroke="#222"
        strokeWidth="1"
      />

      {/* Table front face */}
      <polygon
        points={`
          ${cx - tableW * 0.50},${tableY + tableH}
          ${cx + tableW * 0.50},${tableY + tableH}
          ${cx + tableW * 0.50},${tableY + tableH + 18}
          ${cx - tableW * 0.50},${tableY + tableH + 18}
        `}
        fill="url(#tableFrontGrad)"
        stroke="#1a1a1a"
        strokeWidth="1"
      />

      {/* Table edge highlight */}
      <line
        x1={cx - tableW * 0.44} y1={tableY}
        x2={cx + tableW * 0.44} y2={tableY}
        stroke={active ? color + "50" : "#2a2a2a"}
        strokeWidth={active ? "1.5" : "1"}
        style={{ transition: "stroke 0.5s" }}
      />

      {/* Center emblem on table */}
      <text
        x={cx} y={tableY + tableH * 0.65}
        textAnchor="middle"
        fontSize="13"
        fill={active ? color + "30" : "#1a1a1a"}
        fontFamily="serif"
        style={{ transition: "fill 0.5s" }}
      >
        ⚔
      </text>

      {/* Glitch corner brackets on table */}
      {[
        [cx - tableW * 0.44, tableY],
        [cx + tableW * 0.44, tableY],
      ].map(([bx, by], i) => (
        <g key={i}>
          <line x1={bx - 8 * (i === 0 ? -1 : 1)} y1={by} x2={bx} y2={by}
            stroke={active ? color + "80" : "#222"} strokeWidth="1.5"
            style={{ transition: "stroke 0.5s" }} />
          <line x1={bx} y1={by} x2={bx} y2={by + 8}
            stroke={active ? color + "80" : "#222"} strokeWidth="1.5"
            style={{ transition: "stroke 0.5s" }} />
        </g>
      ))}

      {/* Speaker connection lines (from persona to table) */}
      {/* These are decorative only — feel of "signal" */}
    </svg>
  );
}

// ── Speaker Highlight Overlay ─────────────────────────────
function SpeakerHalo({ persona, x, y, size }) {
  const s = size * 1.6;
  return (
    <div style={{
      position: "absolute",
      left: x - s / 2,
      top: y - s / 2,
      width: s,
      height: s,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${persona.color}18 0%, transparent 70%)`,
      pointerEvents: "none",
      animation: "speakerGlow 1.2s ease-in-out infinite alternate",
      "--glow-color": persona.color,
    }} />
  );
}

// ── Main Export ───────────────────────────────────────────
export function DebateTable({ personas, currentSpeaker, isRunning }) {
  const W = 680;
  const H = 420;
  const seats = getSeatConfig(personas.length);
  const avatarSize = personas.length <= 2 ? 92 : personas.length === 3 ? 84 : 76;

  return (
    <div style={{
      position: "relative",
      width: W,
      height: H,
      maxWidth: "100%",
      // Scanline overlay on the whole table area
      overflow: "hidden",
    }}>
      {/* Scanlines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10,
        background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.1) 3px,rgba(0,0,0,0.1) 4px)",
      }} />

      {/* Background vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 60%, transparent 40%, rgba(0,0,0,0.7) 100%)",
        zIndex: 1,
      }} />

      {/* Table geometry */}
      <TableSVG W={W} H={H} currentSpeaker={currentSpeaker} />

      {/* Personas */}
      {personas.map((persona, idx) => {
        const seat = seats[idx];
        if (!seat) return null;
        const px = seat.x * W;
        const py = seat.y * H;
        const isSpeaking = currentSpeaker?.id === persona.id;
        const isDimmed = isRunning && !isSpeaking;

        return (
          <React.Fragment key={persona.id}>
            {/* Halo behind avatar when speaking */}
            {isSpeaking && (
              <SpeakerHalo persona={persona} x={px} y={py} size={avatarSize} />
            )}

            {/* Avatar */}
            <div style={{
              position: "absolute",
              left: px,
              top: py,
              transform: "translate(-50%, -50%)",
              zIndex: isSpeaking ? 8 : 5,
              transition: "filter 0.5s ease, opacity 0.5s ease",
              filter: isDimmed
                ? "brightness(0.25) saturate(0) contrast(0.8)"
                : isSpeaking
                ? "brightness(1.05)"
                : isRunning ? "brightness(0.55) saturate(0)" : "brightness(0.6) saturate(0)",
              opacity: isDimmed ? 0.45 : 1,
            }}>
              <PersonaAvatar
                persona={persona}
                isSpeaking={isSpeaking}
                isActive={isRunning}
                size={avatarSize}
                showName={true}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
