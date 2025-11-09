// app/page.jsx
"use client";

import MainHeader from "@/components/mian-header";
import MainButton from "@/components/ui/main-button";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div>
      {/* 중앙 카드 */}
      <div className="mx-auto w-[380px] rounded-xl bg-white p-2 flex flex-col h-screen">
        <MainHeader />

        <div className="flex-1 flex flex-col gap-4 justify-center">
          <MainButton
            size="lg"
            onClick={() => router.push("/submit-management")}
          >
            제출물 관리
          </MainButton>
          <MainButton size="lg" onClick={() => router.push("/dive-create")}>
            활동 생성
          </MainButton>
          <MainButton size="lg" onClick={() => router.push("/dive-management")}>
            활동 관리
          </MainButton>

          {/* 로그아웃 */}
          <button
            className="mt-9 mx-auto  block text-[15px] font-medium text-gray-700 cursor-pointer"
            type="button"
          >
            로그아웃 <span className="inline-block translate-y-[1px]">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
