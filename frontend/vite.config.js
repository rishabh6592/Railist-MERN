import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": "http://localhost:5000"
    }
  },
  build: {
    chunkSizeWarningLimit: 1600, // Warning limit badha di (1.6 MB tak warning nahi aayegi)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor"; // Packages ko alag bundle me divide karega
          }
        }
      }
    }
  }
});