// ============================================================
// SESSION STORE
// In-memory Map for MVP. Replace with Redis for production.
//
// To upgrade: npm install ioredis
// Then replace Map operations with redis.set/get/del
// ============================================================

export const sessionStore = new Map();

// Auto-cleanup sessions older than 2 hours
setInterval(() => {
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const now = Date.now();
  for (const [id, session] of sessionStore.entries()) {
    if (now - session.createdAt > TWO_HOURS) {
      sessionStore.delete(id);
      console.log(`[Session] Cleaned up expired session: ${id}`);
    }
  }
}, 30 * 60 * 1000); // run every 30 min
