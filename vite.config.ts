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
      // Vite blocks requests whose Host header it does not recognise. Allow the
      // LAN addresses so a phone loading http://192.168.1.40:5174 is not refused.
      allowedHosts: true,
    },
  };
});
