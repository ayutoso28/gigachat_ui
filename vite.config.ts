import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Прокси для обхода CORS и самоподписанного корневого сертификата Минцифры.
// /api/ngw  → https://ngw.devices.sberbank.ru:9443   (OAuth)
// /api/giga → https://gigachat.devices.sberbank.ru   (чат-комплишены и пр.)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/ngw": {
        target: "https://ngw.devices.sberbank.ru:9443",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ngw/, ""),
      },
      "/api/giga": {
        target: "https://gigachat.devices.sberbank.ru",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/giga/, ""),
      },
    },
  },
});
