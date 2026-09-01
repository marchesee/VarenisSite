import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies /api to the backend so the browser never needs
// to know the backend's real address, and no Stripe secret ever ships
// to the client.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4242",
        changeOrigin: true,
      },
    },
  },
});
