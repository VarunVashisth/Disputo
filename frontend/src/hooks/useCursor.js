

import { useEffect } from "react";

export function useCursor() {
  useEffect(() => {
    // Create cursor elements
    const cursor = document.createElement("div");
    cursor.id = "custom-cursor";
    const trail = document.createElement("div");
    trail.id = "cursor-trail";
    document.body.appendChild(cursor);
    document.body.appendChild(trail);

    let trailX = 0, trailY = 0;
    let mouseX = 0, mouseY = 0;
    let raf;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + "px";
      cursor.style.top  = mouseY + "px";
    };

    // Smooth trailing for the ring
    const animateTrail = () => {
      trailX += (mouseX - trailX) * 0.15;
      trailY += (mouseY - trailY) * 0.15;
      trail.style.left = trailX + "px";
      trail.style.top  = trailY + "px";
      raf = requestAnimationFrame(animateTrail);
    };
    raf = requestAnimationFrame(animateTrail);

    // Hover detection — changes cursor on interactive elements
    const onMouseOver = (e) => {
      const el = e.target.closest("button, a, [role='button'], input, select, textarea, label, [data-hover]");
      if (el) {
        cursor.classList.add("hovering");
        // Change trail color based on data-accent on hovered element
        const accent = el.dataset.accent;
        if (accent) {
          trail.style.borderColor = accent;
          cursor.style.background = accent;
        }
      }
    };
    const onMouseOut = (e) => {
      const el = e.target.closest("button, a, [role='button'], input, select, textarea, label, [data-hover]");
      if (el) {
        cursor.classList.remove("hovering");
        trail.style.borderColor = "rgba(240, 236, 228, 0.3)";
        cursor.style.background = "";
      }
    };

    const onMouseDown = () => cursor.classList.add("clicking");
    const onMouseUp   = () => cursor.classList.remove("clicking");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout",  onMouseOut);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup",   onMouseUp);

    return () => {
      cancelAnimationFrame(raf);
      document.body.removeChild(cursor);
      document.body.removeChild(trail);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout",  onMouseOut);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup",   onMouseUp);
    };
  }, []);
}
