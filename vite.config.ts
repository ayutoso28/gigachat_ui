import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Прокси для обхода CORS и самоподписанного корневого сертификата Минцифры.
// /ngw  → https://ngw.devices.sberbank.ru:9443   (OAuth)
// /giga → https://gigachat.devices.sberbank.ru   (чат-комплишены и пр.)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ngw": {
        target: "https://ngw.devices.sberbank.ru:9443",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ngw/, ""),
      },
      "/giga": {
        target: "https://gigachat.devices.sberbank.ru",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/giga/, ""),
      },
    },
  },
});
