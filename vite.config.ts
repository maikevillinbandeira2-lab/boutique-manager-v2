import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: ".", // Garante que o index.html está na raiz
  build: {
    outDir: "dist",
  },
});
