// app/dive-management/first/[id]/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ACTIVITIES } from "@/data/activity"; // 경로 맞게 수정

export default function DiveSubmitPage() {
  const { id } = useParams(); // e.g. ACT-250301-ULJ-01
  const router = useRouter();

  const activity = useMemo(
    () => ACTIVITIES.find((a) => a.id === id) ?? ACTIVITIES[0],
    [id]
  );

  // ---- 폼 상태 (임시) ----
  const [date, setDate] = useState(
    activity?.updatedAt?.slice(0, 10) || "2025-10-31"
  );
  const [time, setTime] = useState("14:20");
  const [coords, setCoords] = useState("");
  const [depth, setDepth] = useState("");
  const [temp, setTemp] = useState("");
  const [current, setCurrent] = useState("중간"); // 조류: 잔잔/중간/강함
  const [visibility, setVisibility] = useState("");

  // ---- 모바일/데스크톱 동작 분기 ----
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  // 네이티브 피커 호출 refs
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  // 🔒 요청: "날짜 관련 코드 손대지 말기" — 아래 3개 함수는 그대로 둡니다.
  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (el && typeof el.showPicker === "function") {
      el.showPicker(); // Chrome/Edge 등
    } else {
      const v = prompt("날짜 (YYYY-MM-DD)", date);
      if (v) setDate(v);
    }
  };

  const openTimePicker = () => {
    const el = timeInputRef.current;
    if (el && typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      const v = prompt("시간 (HH:MM)", time);
      if (v) setTime(v);
    }
  };

  const short = (d) => (d?.length >= 8 ? d.slice(2) : d);
  const rangeLabel = `${short(activity.startDate)} ~ ${short(
    activity.endDate
  )}`;

  // ---- helpers (세션 저장 전용) ----
  const toTimeObj = (hhmm) => {
    const [h = "0", m = "0"] = (hhmm || "").split(":");
    return {
      hour: Number(h) || 0,
      minute: Number(m) || 0,
      second: 0,
      nano: 0,
    };
  };

  const parseCoords = (s) => {
    // 입력 예: "129.3700, 36.0500"
    const [a, b] = (s || "").split(",").map((v) => Number(v.trim()));
    // 필요에 맞게 위경도 순서 조정 (여기서는 "경도, 위도"로 입력했다고 가정)
    return {
      longitude: Number.isFinite(a) ? a : 0,
      latitude: Number.isFinite(b) ? b : 0,
    };
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

  // (선택) 기존 임시값 복구
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`diveDraft:${id}`);
      if (!raw) return;
      const d = JSON.parse(raw);

      if (d.recordDate) setDate(d.recordDate);
      if (d.startTime)
        setTime(
          `${String(d.startTime.hour).padStart(2, "0")}:${String(
            d.startTime.minute
          ).padStart(2, "0")}`
        );
      if (
        Number.isFinite(d.latitude) &&
        Number.isFinite(d.longitude) &&
        (d.latitude !== 0 || d.longitude !== 0)
      ) {
        setCoords(`${d.longitude}, ${d.latitude}`);
      }
      if (Number.isFinite(d.depthM)) setDepth(String(d.depthM));
      if (Number.isFinite(d.waterTempC)) setTemp(String(d.waterTempC));
      if (Number.isFinite(d.visibilityM)) setVisibility(String(d.visibilityM));
      // d.currentState 역매핑은 생략 (필요하면 추가)
    } catch {}
  }, [id]);

  const handleCollectLocation = () => {
    // TODO: 실제 geolocation 연동
    setCoords("129.3700, 36.0500");
  };

  const saveDraftObject = () => {
    const { latitude, longitude } = parseCoords(coords);
    const draft = {
      recordDate: date, // YYYY-MM-DD
      startTime: toTimeObj(time),
      endTime: toTimeObj(time),
      latitude,
      longitude,
      depthM: Number(depth) || 0,
      waterTempC: Number(temp) || 0,
      visibilityM: Number(visibility) || 0,
      currentState: mapCurrent(current), // LOW/MEDIUM/HIGH
    };
    sessionStorage.setItem(`diveDraft:${id}`, JSON.stringify(draft));
    return draft;
  };

  const handleSaveDraft = () => {
    const draft = saveDraftObject();
    console.log("임시 저장", { id, ...draft });
    alert("임시 저장했습니다.");
  };

  const handleNext = () => {
    const draft = saveDraftObject();
    console.log("다음 단계", { id, ...draft });
    // ✅ second/[id]로 이동
    router.push(`/dive-management/second/${id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-[380px] px-3 py-4">
        {/* 상단 액티비티 요약 pill */}
        <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[15px] text-gray-700 flex items-center gap-2">
          <span className="font-semibold">{activity.title}</span>
          <span className="text-gray-500">{rangeLabel}</span>
          <span className="ml-auto text-sky-500 underline underline-offset-2 cursor-pointer">
            {activity.region}
          </span>
        </div>

        {/* 날짜/시간 (날짜 관련 코드 변경 없음) */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* 날짜 */}
          <div
            className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            onClick={!isMobile ? openDatePicker : undefined}
          >
            <div className="text-[17px] text-gray-700">{date}</div>
            <div className="mt-2 w-full text-center text-sky-500 font-semibold cursor-pointer">
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
                  : "absolute right-4 top-4 h-0 w-0 opacity-0 pointer-events-none"
              }
              inputMode="none"
            />
          </div>

          {/* 시간 */}
          <div
            className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            onClick={!isMobile ? openTimePicker : undefined}
          >
            <div className="text-[17px] text-gray-700">{time}</div>
            <div className="mt-2 w-full text-center text-sky-500 font-semibold cursor-pointer">
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
                  : "absolute right-4 top-4 h-0 w-0 opacity-0 pointer-events-none"
              }
              step="60"
              inputMode="none"
            />
          </div>
        </div>

        {/* 위치 */}
        <div className="mt-5">
          <div className="text-sm text-gray-600 mb-2">위치</div>
          <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <input
              className="flex-1 px-4 py-3 outline-none text-gray-700"
              placeholder="위도, 경도"
              value={coords}
              onChange={(e) => setCoords(e.target.value)}
            />
            <button
              className="px-4 py-3 text-sky-500 font-semibold cursor-pointer"
              onClick={handleCollectLocation}
              type="button"
            >
              수집
            </button>
          </div>
        </div>

        {/* 수심/수온 */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {/* 수심 */}
          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm p-2">
            <div className="text-sm text-gray-500 px-2">수심</div>
            <div className="px-2 pb-2">
              <input
                className="w-full pr-12 py-2 outline-none text-gray-700"
                placeholder="입력"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                inputMode="decimal"
              />
              <span className="pointer-events-none absolute right-3 bottom-2.5 text-gray-500 select-none">
                M
              </span>
            </div>
          </div>

          {/* 수온 */}
          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm p-2">
            <div className="text-sm text-gray-500 px-2">수온</div>
            <div className="px-2 pb-2">
              <input
                className="w-full pr-12 py-2 outline-none text-gray-700"
                placeholder="입력"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                inputMode="decimal"
              />
              <span className="pointer-events-none absolute right-3 bottom-2.5 text-gray-500 select-none whitespace-nowrap">
                °C
              </span>
            </div>
          </div>
        </div>

        {/* 조류 (세그먼트) */}
        <div className="mt-5">
          <div className="text-sm text-gray-600 mb-2">조류</div>
          <div className="grid grid-cols-3 gap-2">
            {["잔잔", "중간", "강함"].map((opt) => {
              const active = current === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCurrent(opt)}
                  className={[
                    "h-10 rounded-xl font-semibold cursor-pointer",
                    active
                      ? "bg-white border border-gray-300 shadow-sm"
                      : "bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* 시야 */}
        <div className="mt-5">
          <div className="text-sm text-gray-600 mb-2">시야</div>
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <input
              className="w-full pr-12 px-4 py-3 outline-none text-gray-700"
              placeholder="수중 가시 거리 입력"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              inputMode="decimal"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">
              M
            </span>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="h-12 rounded-2xl bg-gray-100 text-gray-800 font-semibold shadow-sm cursor-pointer"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="h-12 rounded-2xl bg-[#2F80ED] text-white font-semibold shadow-md hover:brightness-105 cursor-pointer"
          >
            다음 단계
          </button>
        </div>
      </div>
    </div>
  );
}
