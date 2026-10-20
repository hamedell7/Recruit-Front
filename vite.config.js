import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_ALLOWED_HOSTS = ["selection.esata.ir"];

function readPort(value, fallback) {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : fallback;
}

export default defineConfig(({ mode }) => {
  // APP_* values configure Vite itself and are not exposed to browser code like VITE_* values.
  const env = loadEnv(mode, process.cwd(), "APP_");
  const host = env.APP_HOST?.trim() || "0.0.0.0";
  const configuredHosts = (env.APP_ALLOWED_HOSTS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const allowedHosts = configuredHosts.length
    ? configuredHosts
    : DEFAULT_ALLOWED_HOSTS;

  return {
    plugins: [react()],

    server: {
      port: readPort(env.APP_PORT, 5173),
      host,
      allowedHosts,
    },

    preview: {
      port: readPort(env.APP_PREVIEW_PORT, 4173),
      host,
      allowedHosts,
    },

    build: {
      target: "es2022",
      sourcemap: false,
    },

    legacy: {
      inconsistentCjsInterop: true,
    },
  };
});
