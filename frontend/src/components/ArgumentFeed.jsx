

import React, { useEffect, useRef } from "react";

function ArgumentCard({ entry, isLatest }) {
  return (
    <div style={{
      borderLeft: `2px solid ${entry.color}`,
      paddingLeft: 16,
      paddingTop: 4,
      paddingBottom: 4,
      animation: isLatest ? "bubbleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" : "none",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: entry.color, flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: 13,
          letterSpacing: 3,
          color: entry.color,
        }}>{entry.personaName}</span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: "var(--white-mute)",
          letterSpacing: 1,
        }}>· {entry.ideology.toUpperCase()} · TURN {entry.turn}</span>
      </div>

      {/* Argument text */}
      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: 14,
        lineHeight: 1.75,
        color: "var(--white-dim)",
        margin: 0,
        fontStyle: "italic",
      }}>
        "{entry.summary}"
      </p>
    </div>
  );
}

function StreamingCard({ persona, text, isLoading }) {
  return (
    <div style={{
      borderLeft: `2px solid ${persona.color}`,
      paddingLeft: 16,
      paddingTop: 4,
      animation: "bubbleIn 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: persona.color,
          animation: "blink 0.8s infinite",
        }} />
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: 13, letterSpacing: 3, color: persona.color,
        }}>{persona.name}</span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--white-mute)",
        }}>
          {isLoading ? "· THINKING..." : "· SPEAKING..."}
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", gap: 5, alignItems: "center", paddingTop: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: "50%",
              background: persona.color, opacity: 0.6,
              animation: `blink 1s ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      ) : (
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 14, lineHeight: 1.75,
          color: "var(--white-mute)", margin: 0, fontStyle: "italic",
        }}>
          "{text}"
          <span style={{
            display: "inline-block",
            width: 2, height: 14,
            background: persona.color,
            marginLeft: 2,
            animation: "blink 0.7s infinite",
            verticalAlign: "middle",
          }} />
        </p>
      )}
    </div>
  );
}

export function ArgumentFeed({ argumentHistory, currentSpeaker, streamingText, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [argumentHistory.length, streamingText]);

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}>
      {argumentHistory.length === 0 && !currentSpeaker && (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--white-mute)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: 2,
          textAlign: "center",
          gap: 12,
        }}>
          <div style={{ fontSize: 32 }}>—</div>
          <div>DEBATE WILL BEGIN SHORTLY</div>
          <div style={{ fontSize: 9, color: "#333" }}>ARGUMENTS WILL APPEAR HERE</div>
        </div>
      )}

      {argumentHistory.map((entry, i) => (
        <ArgumentCard
          key={i}
          entry={entry}
          isLatest={i === argumentHistory.length - 1 && !currentSpeaker}
        />
      ))}

      {/* Live streaming card */}
      {currentSpeaker && (
        <StreamingCard
          persona={currentSpeaker}
          text={streamingText}
          isLoading={isLoading}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
