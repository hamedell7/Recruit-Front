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
  const rawAllowedHosts = env.APP_ALLOWED_HOSTS?.trim();
  let configuredHosts = DEFAULT_ALLOWED_HOSTS;

  if (rawAllowedHosts) {
    let parsedHosts;

    if (rawAllowedHosts.startsWith("[")) {
      try {
        parsedHosts = JSON.parse(rawAllowedHosts);
      } catch {
        throw new Error(
          "APP_ALLOWED_HOSTS must be a valid JSON array of hostnames.",
        );
      }

      if (!Array.isArray(parsedHosts)) {
        throw new Error("APP_ALLOWED_HOSTS must be a JSON array of hostnames.");
      }
    } else {
      // Backward compatibility for the previous comma-separated format.
      parsedHosts = rawAllowedHosts.split(",");
    }

    if (
      !parsedHosts.every((item) => typeof item === "string" && item.trim().length > 0)
    ) {
      throw new Error("APP_ALLOWED_HOSTS must contain only non-empty hostnames.");
    }

    configuredHosts = [...new Set(parsedHosts.map((item) => item.trim().toLowerCase()))];
  }

  const allowedHosts = configuredHosts;

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
