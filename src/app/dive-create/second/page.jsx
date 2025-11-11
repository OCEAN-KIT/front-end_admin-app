// app/dive-create/second/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/api/upload-image";
import { createSubmission } from "@/api/submissions";
import {
  ChevronLeft,
  ClipboardList,
  TriangleAlert,
  Images,
  Plus,
  Trash2,
  Check,
} from "lucide-react";

const DEBUG = true;
const TEST_NO_ATTACH = false;

/** S3 key -> public URL (뷰에서만 사용; 서버 저장은 key만) */
const keyToPublicUrl = (key) => {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || "";
  const cleanBase = base.replace(/\/+$/, "");
  const cleanKey = String(key || "").replace(/^\/+/, "");
  return cleanBase ? `${cleanBase}/${cleanKey}` : `/${cleanKey}`;
};

const n = (v, fb = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
};

const pad = (num, len = 2) => String(num).padStart(len, "0");
const toLocalDateTimeString = (d) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${ms}`;
};

function labelToActivityType(label) {
  switch (label) {
    case "이식":
      return "TRANSPLANT";
    case "폐기물 수거":
      return "TRASH_COLLECTION";
    case "성게 제거":
      return "URCHIN_REMOVAL";
    case "연구":
    case "모니터링":
    case "기타":
    default:
      return "OTHER";
  }
}

export default function DiveCreateStep2Page() {
  const router = useRouter();

  // 활동 유형 (세그먼트 버튼)
  const WORK_TYPES = [
    "이식",
    "폐기물 수거",
    "성게 제거",
    "연구",
    "모니터링",
    "기타",
  ];
  const [workType, setWorkType] = useState("이식");

  // 내용/사건
  const [details, setDetails] = useState("");
  const [incidentText, setIncidentText] = useState("");
  const DETAILS_MAX = 2000;
  const INCIDENT_MAX = 2000;

  // 첨부 (최대 10)
  const [attachments, setAttachments] = useState([]);
  const fileRef = useRef(null);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none text-gray-800 placeholder:text-gray-400 focus:ring-4 focus:ring-sky-100 focus:border-sky-300 transition";
  const cardCls =
    "rounded-2xl border border-gray-200 bg-white/90 backdrop-blur p-4";
  const labelCls = "text-[13px] text-gray-500 mb-1.5";

  const toHHMMSS = (t) => {
    if (!t) return "00:00:00";
    const pad2 = (x) => String(Number(x) || 0).padStart(2, "0");
    return `${pad2(t.hour)}:${pad2(t.minute)}:${pad2(t.second)}`;
  };

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const next = [...attachments, ...files].slice(0, 10);
    setAttachments(next);
    if (fileRef.current) fileRef.current.value = "";
  };
  const removeOne = (idx) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const canSubmit = useMemo(() => {
    // 최소 제출 가드: 내용/사건/첨부 중 하나는 있어야 함
    return Boolean(details.trim() || incidentText.trim() || attachments.length);
  }, [details, incidentText, attachments.length]);

  async function handleSubmit() {
    try {
      // 1) step1 저장분 복구
      const raw = sessionStorage.getItem("diveDraft");
      const d = raw ? JSON.parse(raw) : {};
      if (DEBUG) console.log("[submit] step1 draft =", d);

      // 2) 첨부 업로드
      let uploaded = [];
      if (!TEST_NO_ATTACH) {
        for (const f of attachments) {
          const key = await uploadImage(f); // presigned PUT
          if (DEBUG)
            console.log("[upload] done =>", {
              key,
              preview: keyToPublicUrl(key),
            });
          uploaded.push({
            fileName: f.name,
            fileUrl: key, // ✅ 서버에는 key만!
            mimeType: f.type,
            fileSize: n(f.size),
          });
        }
      }

      // 3) activityType, details
      const apiType = labelToActivityType(workType);
      const detailsCombined = incidentText?.trim()
        ? `${details}\n\n[환경이상/사고 보고]\n${incidentText}`
        : details;

      // 4) payload (Swagger 스펙 준수)
      const payload = {
        siteName: d.siteName || "Unknown Site",
        activityType: apiType,
        submittedAt: toLocalDateTimeString(new Date()),
        authorName: "string",
        authorEmail: "string",
        feedbackText: "",
        latitude: n(d.latitude),
        longitude: n(d.longitude),
        basicEnv: {
          recordDate: d.recordDate ?? new Date().toISOString().slice(0, 10),
          startTime: toHHMMSS(d.startTime),
          endTime: toHHMMSS(d.endTime ?? d.startTime),
          waterTempC: n(d.waterTempC),
          visibilityM: n(d.visibilityM),
          depthM: n(d.depthM),
          currentState: d.currentState || "LOW",
          weather: d.weather || "SUNNY",
        },
        participants: {
          leaderName: "김다이버",
          participantCount: 1,
          role: "CITIZEN_DIVER",
        },
        activity: {
          type: apiType,
          details: detailsCombined,
          collectionAmount: 0,
          durationHours: 0,
        },
        attachments: uploaded,
      };

      if (DEBUG)
        console.log("[submit] payload =", JSON.stringify(payload, null, 2));

      const res = await createSubmission(payload);
      console.log("[submit] response =", res);
      alert("제출 완료!");
      router.replace("/home");
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("[submit] ERROR status =", status);
      console.error("[submit] ERROR body   =", data);
      alert(
        status === 500
          ? "서버 500 오류: 콘솔 로그 확인"
          : `제출 실패: ${status ?? ""}`
      );
    }
  }

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
        {/* 작업 유형 */}
        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-4 w-4 text-sky-600" />
            <h2 className="text-[14px] font-semibold text-gray-800">
              작업 유형
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {WORK_TYPES.map((opt) => {
              const active = workType === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setWorkType(opt)}
                  className={[
                    "h-10 rounded-xl text-[13px] font-semibold transition",
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

        {/* 작업 내용 */}
        <section className={cardCls}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-sky-600" />
              <h2 className="text-[14px] font-semibold text-gray-800">
                작업 내용
              </h2>
            </div>
            <span className="text-[12px] text-gray-400">
              {details.length}/{DETAILS_MAX}
            </span>
          </div>
          <label className="block">
            <span className={labelCls}>메시지를 입력해 주세요.</span>
            <textarea
              className={`${inputCls} h-44 resize-none`}
              placeholder="메시지를 입력해 주세요."
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, DETAILS_MAX))}
              maxLength={DETAILS_MAX}
            />
          </label>
        </section>

        {/* 환경이상 / 사고 보고 */}
        <section className={cardCls}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-amber-600" />
              <h2 className="text-[14px] font-semibold text-gray-800">
                환경이상 / 사고 보고
              </h2>
            </div>
            <span className="text-[12px] text-gray-400">
              {incidentText.length}/{INCIDENT_MAX}
            </span>
          </div>
          <label className="block">
            <span className={labelCls}>발생 내용을 상세히 입력해 주세요.</span>
            <textarea
              className={`${inputCls} h-44 resize-none`}
              placeholder="발생한 환경 이상 징후나 안전 사고 내용을 상세히 입력해 주세요."
              value={incidentText}
              onChange={(e) =>
                setIncidentText(e.target.value.slice(0, INCIDENT_MAX))
              }
              maxLength={INCIDENT_MAX}
            />
          </label>
        </section>

        {/* 첨부 */}
        <section className={cardCls}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Images className="h-4 w-4 text-sky-600" />
              <h2 className="text-[14px] font-semibold text-gray-800">
                활동 사진 및 동영상
              </h2>
            </div>
            <span className="text-[12px] text-gray-400">
              {attachments.length}/10
            </span>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={onPickFiles}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-20 w-20 rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 hover:bg-sky-50 text-sky-700 flex flex-col items-center justify-center shadow-sm"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[11px] mt-1">추가</span>
            </button>

            <div className="flex flex-wrap gap-2">
              {attachments.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="relative h-20 w-20 overflow-hidden rounded-xl bg-white border border-gray-200"
                >
                  {f.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                      🎬
                    </div>
                  )}
                  <button
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-black/70 text-white text-xs"
                    onClick={() => removeOne(idx)}
                    type="button"
                    aria-label="remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 요약 바 */}
        <section className={cardCls + " flex items-center justify-between"}>
          <div className="text-[12px] text-gray-500">
            <div>
              첨부 파일:{" "}
              <span className="font-medium text-gray-700">
                {attachments.length}
              </span>{" "}
              개
            </div>
          </div>
          {canSubmit ? (
            <div className="inline-flex items-center gap-1 text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
              <Check className="h-3.5 w-3.5" /> 제출 가능
            </div>
          ) : (
            <div className="text-[12px] text-gray-500">
              내용/사건/첨부 중 하나 이상 입력 필요
            </div>
          )}
        </section>
        <div className="mx-auto max-w-[420px] py-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              const raw = sessionStorage.getItem("diveDraft");
              console.log("draft payload:", raw ? JSON.parse(raw) : {});
              alert("임시 저장(콘솔 확인)");
            }}
            className="h-12 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 active:translate-y-[1px]"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-12 rounded-xl bg-[#2F80ED] text-white font-semibold  hover:brightness-105 active:translate-y-[1px] disabled:opacity-50"
          >
            제출하기
          </button>
        </div>
      </main>
    </div>
  );
}
