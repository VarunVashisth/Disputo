import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxies /api/* → backend:3001
      // This means frontend never needs to know the backend URL
      // Change target when deploying to production
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
