// src/app/_sw-register.tsx
"use client";
import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // classic SW (compat importScripts) → type 옵션 필요 없음
      navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    }
  }, []);
  return null;
}
