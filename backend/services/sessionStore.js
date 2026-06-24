

export const sessionStore = new Map();

setInterval(() => {
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const now = Date.now();
  for (const [id, session] of sessionStore.entries()) {
    if (now - session.createdAt > TWO_HOURS) {
      sessionStore.delete(id);
      console.log(`[Session] Cleaned up expired session: ${id}`);
    }
  }
}, 30 * 60 * 1000); 