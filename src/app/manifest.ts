import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa", // ✅ 고정 App ID
    name: "Ocean-Kit",
    short_name: "Ocean-Kit",
    description: "A Progressive Web App built with Next.js",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1677ff",
    icons: [
      {
        src: "/icons/Ocean-Campus-Logo192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/Ocean-Campus-Logo192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },

      {
        src: "/icons/Ocean-Campus-Logo512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/Ocean-Campus-Logo512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    // ✅ 리치 설치 카드용 스크린샷(둘 다 필요)
    screenshots: [
      {
        src: "/images/ss540.png",
        sizes: "540x960", // 예시(세로형) — 실제 파일 픽셀과 일치해야 함
        type: "image/png",
        form_factor: "narrow", // 모바일
      },
      {
        src: "/images/ss1280.png",
        sizes: "1280x800", // 예시(가로형)
        type: "image/png",
        form_factor: "wide", // 데스크톱
      },
    ],
  };
}
