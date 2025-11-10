// app/(auth)/login/page.tsx
"use client";

import { logIn } from "@/api/auth";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ClipLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function LoginPage() {
  const { checking, isLoggedIn } = useAuthGuard({ mode: "gotoHome" });

  const router = useRouter();

  // ✅ demo 모드 여부: URL ?demo=1 일 때만 동작 (배포 상태에서도 안전)
  const demoMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    const sp = new URLSearchParams(window.location.search);
    return sp.get("demo") === "1";
  }, []);

  // ✅ 자동 로그인까지 원하면 ?autologin=1 추가
  const autoLogin = useMemo(() => {
    if (typeof window === "undefined") return false;
    const sp = new URLSearchParams(window.location.search);
    return sp.get("autologin") === "1";
  }, []);

  // ✅ 초기 폼 상태
  const [form, setForm] = useState({ id: "", password: "" });
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [sending, setSending] = useState(false);

  // ✅ 마운트 이후에만 데모 크리덴셜 주입 (SSR 흔들림 방지)
  useEffect(() => {
    if (demoMode) {
      setForm({ id: "admin@admin.com", password: "password" });
    }
  }, [demoMode]);

  // ✅ 데모 & 자동로그인 플래그가 있으면 바로 로그인 시도
  useEffect(() => {
    const doAuto = async () => {
      if (!demoMode || !autoLogin) return;
      try {
        setErrorMsg("");
        setSending(true);
        await logIn("admin@admin.com", "password");
        router.push("/home");
      } catch (err) {
        console.error("자동 로그인 에러:", err);
        setErrorMsg("자동 로그인 중 오류가 발생했습니다.");
      } finally {
        setSending(false);
      }
    };
    doAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, autoLogin]);

  if (checking || isLoggedIn) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg("");
      setSending(true);
      await logIn(form.id, form.password);
      router.push("/home");
    } catch (err) {
      console.error("로그인 에러:", err);
      setErrorMsg("로그인 중 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="
        mx-auto min-h-screen max-w-[420px]
        bg-[#F6F7F9] text-gray-900
        flex flex-col
      "
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <main className="flex-1 px-5 py-8 flex flex-col justify-center">
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="text-[32px] font-extrabold text-blue-500 ">
            Ocean Campus
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-gray-700">
              아이디
            </label>
            <input
              name="id"
              type="text"
              value={form.id}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              autoComplete="username" // ✅ 브라우저 자동완성 힌트
              className="
                h-12 w-full rounded-2xl
                border-0 ring-1 ring-gray-200
                bg-white px-4 text-[15px]
                placeholder:text-gray-400
                focus:ring-2 focus:ring-blue-500 focus:outline-none
              "
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-gray-700">
              비밀번호
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password" // ✅ 브라우저 자동완성 힌트
              className="
                h-12 w-full rounded-2xl
                border-0 ring-1 ring-gray-200
                bg-white px-4 text-[15px]
                placeholder:text-gray-400
                focus:ring-2 focus:ring-blue-500 focus:outline-none
              "
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="
              mt-2 h-12 w-full rounded-xl
              bg-[#3B82F6] text-white text-[15px] font-semibold
              shadow-md active:translate-y-[1px]
              transition cursor-pointer disabled:opacity-60
              flex items-center justify-center
            "
            aria-busy={sending}
          >
            {sending ? (
              <ClipLoader size={20} color="#FFFFFF" speedMultiplier={0.9} />
            ) : (
              "로그인"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/register")}
            className="text-[13px] font-medium text-gray-700 underline underline-offset-4 cursor-pointer"
          >
            회원가입
          </button>
        </div>
      </main>
    </div>
  );
}
