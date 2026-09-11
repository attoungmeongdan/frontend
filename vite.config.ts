import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "핏틀 Fittle",
        short_name: "핏틀",
        start_url: "/",
        scope: "/",
        // 주소창 없이 앱처럼 띄운다
        display: "standalone",
        theme_color: "#0f989a",
        background_color: "#ffffff",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: { cacheName: "pages" },
          },
          {
            urlPattern: ({ request }) =>
              ["style", "script", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "assets" },
          },
          {
            // 운동 카운트 음성. 한 번 받으면 바뀌지 않으므로 캐시를 먼저 본다.
            // fetch 로 미리 받을 때는 destination 이 비어 있어 경로로 판별한다
            urlPattern: ({ url }) => url.pathname.startsWith("/voice/"),
            handler: "CacheFirst",
            options: {
              cacheName: "voice",
              expiration: { maxEntries: 64 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
