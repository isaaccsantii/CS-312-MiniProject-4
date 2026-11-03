import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React dev server runs on http://localhost:5173 and calls the Express API on port 8000.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
