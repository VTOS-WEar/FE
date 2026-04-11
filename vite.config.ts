import { screenGraphPlugin } from "@animaapp/vite-plugin-screen-graph";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

const devCertDir = path.resolve(__dirname, "../BE/VTOS.API/certs");
const httpsKeyPath = path.join(devCertDir, "lan-192.168.1.6.key");
const httpsCertPath = path.join(devCertDir, "lan-192.168.1.6.crt");

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "development" && screenGraphPlugin()],
  publicDir: "./static",
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    https: {
      key: fs.readFileSync(httpsKeyPath),
      cert: fs.readFileSync(httpsCertPath),
    },
    proxy: {
      "/api": {
        target: "https://192.168.1.6:7093",
        changeOrigin: true,
        secure: false,
      },
    },
  },
}));
