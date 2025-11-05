"use client";

import { useEffect, useState } from "react";

declare global {
  interface Navigator {
    /** iOS Safari에서 PWA로 실행 중일 때 true */
    standalone?: boolean;
  }
}

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 'any' 없이 iOS 판별 (MSStream 존재 여부로 IE 계열 제외)
    const isiOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);

    // PWA 실행 여부: 표준 + iOS 전용 속성 모두 확인
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      !!navigator.standalone;

    setIsIOS(isiOS);
    setIsStandalone(standalone);
  }, []);

  if (isStandalone) return null; // 이미 설치된 경우 버튼 숨김

  return (
    <div>
      <h3>Install App</h3>
      <button>Add to Home Screen</button>
      {isIOS && (
        <p>
          iOS에서는 공유 버튼{" "}
          <span role="img" aria-label="share icon">
            ⎋
          </span>
          을 눌러 <strong>홈 화면에 추가</strong>
          <span role="img" aria-label="plus icon">
            ➕
          </span>
          를 선택하세요.
        </p>
      )}
    </div>
  );
}
