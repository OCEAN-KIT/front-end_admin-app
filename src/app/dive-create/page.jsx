// app/dive-create/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock3,
  MapPin,
  Gauge,
  Thermometer,
  Waves,
  Eye,
  LocateFixed,
} from "lucide-react";

export default function DiveCreateStep1Page() {
  const router = useRouter();

  // ✅ 필수값: 사이트명
  const [siteName, setSiteName] = useState("");

  // 날짜/시간 (기본값 유지)
  const [date, setDate] = useState("2025-10-31");
  const [time, setTime] = useState("14:20");

  // 환경값
  const [coords, setCoords] = useState(""); // "경도, 위도" 또는 "위도, 경도"
  const [depth, setDepth] = useState("");
  const [temp, setTemp] = useState("");
  const [current, setCurrent] = useState("중간"); // 잔잔/중간/강함
  const [visibility, setVisibility] = useState("");

  // 디바이스 특성 (모바일 입력 UX)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  // input refs
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  // helpers — 시간/좌표/조류 매핑
  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (el && typeof el.showPicker === "function") el.showPicker();
    else {
      const v = prompt("날짜 (YYYY-MM-DD)", date);
      if (v) setDate(v);
    }
  };
  const openTimePicker = () => {
    const el = timeInputRef.current;
    if (el && typeof el.showPicker === "function") el.showPicker();
    else {
      const v = prompt("시간 (HH:MM)", time);
      if (v) setTime(v);
    }
  };

  const toTimeObj = (hhmm) => {
    const [h = "0", m = "0"] = (hhmm || "").split(":");
    return { hour: Number(h) || 0, minute: Number(m) || 0, second: 0, nano: 0 };
  };

  // 입력 예시: "129.3700, 36.0500" 또는 "36.0500, 129.3700"
  const parseCoords = (s) => {
    const [a, b] = (s || "").split(",").map((v) => Number(String(v).trim()));
    if (!Number.isFinite(a) || !Number.isFinite(b))
      return { latitude: 0, longitude: 0 };
    // 휴리스틱: |lat| <= 90, |lon| <= 180 — 위도/경도 자동 판별
    const looksLikeLatFirst = Math.abs(a) <= 90 && Math.abs(b) <= 180;
    return looksLikeLatFirst
      ? { latitude: a, longitude: b }
      : { latitude: b, longitude: a };
  };

  const mapCurrent = (label) => {
    switch (label) {
      case "잔잔":
        return "LOW";
      case "강함":
        return "HIGH";
      case "중간":
      default:
        return "MEDIUM";
    }
  };

  const handleCollectLocation = () => {
    // TODO: 실제 geolocation 연동
    setCoords("129.3700, 36.0500");
  };

  const saveDraftObject = () => {
    const { latitude, longitude } = parseCoords(coords);
    const draft = {
      siteName: siteName.trim() || "Unknown Site",
      recordDate: date,
      startTime: toTimeObj(time),
      endTime: toTimeObj(time),
      latitude,
      longitude,
      depthM: Number(depth) || 0,
      waterTempC: Number(temp) || 0,
      visibilityM: Number(visibility) || 0,
      currentState: mapCurrent(current),
      weather: "SUNNY",
    };
    sessionStorage.setItem("diveDraft", JSON.stringify(draft));
    return draft;
  };

  const handleSaveDraft = () => {
    const draft = saveDraftObject();
    console.log("[draft] step1:", draft);
    alert("임시 저장했습니다.");
  };

  const handleNext = () => {
    const draft = saveDraftObject();
    console.log("[next] step1:", draft);
    router.push("/dive-create/second");
  };

  // 공통 인풋 클래스
  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3  outline-none text-gray-800 placeholder:text-gray-400 focus:ring-4 focus:ring-sky-100 focus:border-sky-300 transition";

  const cardCls =
    "rounded-2xl border border-gray-200 bg-white/90 backdrop-blur p-4";

  const labelCls = "text-[13px] text-gray-500 mb-1.5";

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-gray-50 to-white">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-[420px] px-4 h-14 flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl p-1.5 hover:bg-gray-100 active:scale-[0.98] transition"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-[16px] font-semibold tracking-tight">
            활동 제출
          </h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-[420px] px-4 pt-4 pb-32 space-y-4">
        {/* 사이트명 */}
        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-sky-600" />
            <h2 className="text-[14px] font-semibold text-gray-800">
              현장명 (siteName)
            </h2>
          </div>
          <label className="block">
            <span className={labelCls}>예: 울진 A 구역</span>
            <input
              className={inputCls}
              placeholder="울진 A 구역"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              autoComplete="off"
            />
          </label>
        </section>

        {/* 날짜/시간 */}
        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="h-4 w-4 text-sky-600" />
            <h2 className="text-[14px] font-semibold text-gray-800">
              날짜/시간
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* 날짜 */}
            <button
              type="button"
              onClick={!isMobile ? openDatePicker : undefined}
              className="relative text-left"
            >
              <div className={cardCls + " p-3"}>
                <div className="text-[12px] text-gray-500 mb-1">날짜</div>
                <div className="flex items-center gap-2 text-[15px] text-gray-800">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span>{date}</span>
                </div>
                <div className="mt-2 text-[12px] text-sky-600 font-medium">
                  변경
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={
                    isMobile
                      ? "absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                      : "absolute right-2 top-2 h-0 w-0 opacity-0 pointer-events-none"
                  }
                  inputMode="none"
                />
              </div>
            </button>

            {/* 시간 */}
            <button
              type="button"
              onClick={!isMobile ? openTimePicker : undefined}
              className="relative text-left"
            >
              <div className={cardCls + " p-3"}>
                <div className="text-[12px] text-gray-500 mb-1">시간</div>
                <div className="flex items-center gap-2 text-[15px] text-gray-800">
                  <Clock3 className="h-4 w-4 shrink-0" />
                  <span>{time}</span>
                </div>
                <div className="mt-2 text-[12px] text-sky-600 font-medium">
                  변경
                </div>
                <input
                  ref={timeInputRef}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={
                    isMobile
                      ? "absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                      : "absolute right-2 top-2 h-0 w-0 opacity-0 pointer-events-none"
                  }
                  step="60"
                  inputMode="none"
                />
              </div>
            </button>
          </div>
        </section>

        {/* 위치 */}
        <section className={cardCls}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600" />
              <h2 className="text-[14px] font-semibold text-gray-800">위치</h2>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[12px] font-medium text-sky-700 hover:bg-sky-100 active:scale-[0.99]"
              onClick={handleCollectLocation}
              type="button"
            >
              <LocateFixed className="h-3.5 w-3.5" /> 수집
            </button>
          </div>

          <label className="block">
            <span className={labelCls}>경도, 위도 (예: 129.3700, 36.0500)</span>
            <input
              className={inputCls}
              placeholder="129.3700, 36.0500"
              value={coords}
              onChange={(e) => setCoords(e.target.value)}
              autoComplete="off"
            />
          </label>
        </section>

        {/* 수심/수온 */}
        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-4 w-4 text-sky-600" />
            <h2 className="text-[14px] font-semibold text-gray-800">
              수심 / 수온
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="relative block">
              <span className={labelCls}>수심</span>
              <input
                className={inputCls + " pr-12"}
                placeholder="예: 8.5"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                inputMode="decimal"
              />
              <span className="pointer-events-none absolute right-3 top-[38px] text-gray-500 select-none">
                M
              </span>
            </label>

            <label className="relative block">
              <span className={labelCls}>수온</span>
              <input
                className={inputCls + " pr-12"}
                placeholder="예: 18.2"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                inputMode="decimal"
              />
              <span className="pointer-events-none absolute right-3 top-[38px] text-gray-500 select-none">
                °C
              </span>
            </label>
          </div>
        </section>

        {/* 조류 */}
        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-2">
            <Waves className="h-4 w-4 text-sky-600" />
            <h2 className="text-[14px] font-semibold text-gray-800">조류</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["잔잔", "중간", "강함"].map((opt) => {
              const active = current === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCurrent(opt)}
                  className={[
                    "h-10 rounded-xl font-semibold text-[13px] transition",
                    active
                      ? "bg-white border border-sky-200 text-sky-700 ring-2 ring-sky-100"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </section>

        {/* 시야 */}
        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-sky-600" />
            <h2 className="text-[14px] font-semibold text-gray-800">시야</h2>
          </div>
          <label className="relative block">
            <span className={labelCls}>수중 가시 거리</span>
            <input
              className={inputCls + " pr-12"}
              placeholder="예: 4.0"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              inputMode="decimal"
            />
            <span className="pointer-events-none absolute right-3 top-[38px] text-gray-500 select-none">
              M
            </span>
          </label>
        </section>
        <div className="mx-auto max-w-[440px] py-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="h-12 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 active:translate-y-[1px]"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="h-12 rounded-xl bg-[#2F80ED] text-white font-semibold hover:brightness-105 active:translate-y-[1px]"
          >
            다음 단계
          </button>
        </div>
      </main>

      {/* 하단 고정 CTA */}
    </div>
  );
}
