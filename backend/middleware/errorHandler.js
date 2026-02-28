// ============================================================
// ERROR HANDLER MIDDLEWARE
// Catches all unhandled errors and returns consistent JSON
// ============================================================

export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    path: req.path,
  });
}
