// app/page.jsx
"use client";

import MainHeader from "@/components/mian-header";
import MainButton from "@/components/ui/main-button";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { checking, isLoggedIn } = useAuthGuard({ mode: "gotoLogin" });
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* 전체 세로 중앙 */}
      <div className="mx-auto min-h-screen w-[380px] flex flex-col justify-center">
        {/* 상단: 헤더 + 서브타이틀 */}
        <div className="text-center">
          <MainHeader />
          <p className="mt-2 mb-5 text-[13px] text-gray-500">
            바다 활동을 기록하고 제출물을 한 곳에서 관리하세요
          </p>
        </div>

        {/* 구분선(얇고 은은하게) */}
        <div className="my-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* 메인 카드: 버튼 + 짧은 설명 */}
        <div className="rounded-2xl bg-white">
          <div className="p-4 flex flex-col gap-3">
            <MainButton
              size="lg"
              onClick={() => router.push("/submit-management")}
            >
              제출물 관리
            </MainButton>

            <MainButton size="lg" onClick={() => router.push("/dive-create")}>
              활동 생성
            </MainButton>
          </div>
        </div>

        {/* 하단 부가 액션 */}
        <button
          className="mt-8 mx-auto block text-[14px] font-medium text-gray-700"
          type="button"
        >
          로그아웃 <span className="inline-block translate-y-[1px]">›</span>
        </button>
      </div>
    </div>
  );
}
