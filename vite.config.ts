import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The React app and the Laravel API are two independent servers on two ports.
  // There is deliberately no dev proxy: the browser calls the API origin from
  // `VITE_API_BASE_URL` directly, exactly as it will in production.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const port = Number(env.VITE_PORT ?? 5173);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      // Bind every interface so the app is reachable over the LAN, not just
      // from this machine. `VITE_DEV_HOST` overrides when needed.
      host: env.VITE_DEV_HOST ?? "0.0.0.0",
      port,
      strictPort: true,
      // Proxy API + broadcasting to the Laravel backend so the frontend and
      // backend share one origin in dev. This keeps API calls, auth and the
      // Reverb websocket working for every device on the LAN without having to
      // keep VITE_API_BASE_URL in sync with the machine's (changing) IP.
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        '/broadcasting': {
          target: env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        // Reverb speaks the Pusher protocol over /app/{key}; proxying it
        // through Vite keeps realtime working for every device on the LAN.
        '/app': {
          target: `http://127.0.0.1:${env.VITE_REVERB_PORT ?? 8080}`,
          changeOrigin: true,
          ws: true,
        },
      },
      // Vite blocks requests whose Host header it does not recognise. Allow the
      // LAN addresses so a phone loading http://192.168.1.40:5174 is not refused.
      allowedHosts: true,
    },
  };
});
