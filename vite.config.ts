import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Прокси для обхода CORS и самоподписанного корневого сертификата Минцифры.
// Клиент передаёт upstream-путь через query-параметр ?path=...
// /api/ngw?path=/v2/oauth  → https://ngw.devices.sberbank.ru:9443/api/v2/oauth
// /api/giga?path=/v1/...   → https://gigachat.devices.sberbank.ru/api/v1/...
function rewritePath(incomingUrl: string): string {
  const u = new URL(incomingUrl, "http://x");
  const p = u.searchParams.get("path") || "/";
  return `/api${p}`;
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/ngw": {
        target: "https://ngw.devices.sberbank.ru:9443",
        changeOrigin: true,
        secure: false,
        rewrite: rewritePath,
      },
      "/api/giga": {
        target: "https://gigachat.devices.sberbank.ru",
        changeOrigin: true,
        secure: false,
        rewrite: rewritePath,
      },
    },
  },
});
