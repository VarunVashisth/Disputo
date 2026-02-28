// ============================================================
// App.jsx — Root component with routing and cursor
// ============================================================

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SetupPage } from "./pages/SetupPage.jsx";
import { DebatePage } from "./pages/DebatePage.jsx";
import { useCursor } from "./hooks/useCursor.js";

export default function App() {
  useCursor(); // Mounts custom cursor on every page

  return (
    <Routes>
      <Route path="/"        element={<SetupPage />} />
      <Route path="/debate"  element={<DebatePage />} />
      <Route path="*"        element={<Navigate to="/" />} />
    </Routes>
  );
}
