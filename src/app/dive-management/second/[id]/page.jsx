// app/dive-management/second/[id]/page.jsx
"use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ACTIVITIES } from "@/data/activity";
import { uploadImage } from "@/api/upload-image";
import { createSubmission } from "@/api/submissions";

const DEBUG = true;
const TEST_NO_ATTACH = false;

// ── helpers ─────────────────────────────────────────────────────────────
const keyToPublicUrl = (key) => {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE;
  return base ? `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}` : key;
};

const n = (v, fb = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
};

const pad = (num, len = 2) => String(num).padStart(len, "0");

/** Date | string → "YYYY-MM-DDTHH:mm:ss.SSS"  (※ Z 없음, 서버 스펙) */
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

/** {hour, minute, second} → "HH:mm:ss" (서버 스펙) */
const toHHMMSS = (t) => {
  if (!t) return undefined;
  return `${pad(n(t.hour))}:${pad(n(t.minute))}:${pad(n(t.second))}`;
};

// ⚠️ 서버 enum: URCHIN_REMOVAL | TRASH_COLLECTION | OTHER
function labelToActivityType(label) {
  switch (label) {
    case "폐기물 수거":
      return "TRASH_COLLECTION";
    // 현재 UI 항목 중 서버에 없는 것들은 OTHER로 보냄
    case "이식":
    case "연구":
    case "모니터링":
    case "기타":
    default:
      return "OTHER";
  }
}

// ── page ────────────────────────────────────────────────────────────────
export default function DiveSubmitSecondPage() {
  const { id } = useParams();
  const router = useRouter();

  const activity = useMemo(
    () => ACTIVITIES.find((a) => a.id === id) ?? ACTIVITIES[0],
    [id]
  );

  const [workType, setWorkType] = useState("모니터링");
  const [details, setDetails] = useState("");
  const [incidentText, setIncidentText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const fileRef = useRef(null);

  const DETAILS_MAX = 2000;
  const INCIDENT_MAX = 2000;

  const short = (d) => (d?.length >= 8 ? d.slice(2) : d);
  const rangeLabel = `${short(activity.startDate)} ~ ${short(
    activity.endDate
  )}`;

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const next = [...attachments, ...files].slice(0, 10);
    setAttachments(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeOne = (idx) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  // 임시 저장용 payload (콘솔 확인)
  const buildPayload = () => {
    const raw = sessionStorage.getItem(`diveDraft:${id}`);
    const d = raw ? JSON.parse(raw) : {};

    const apiType = labelToActivityType(workType);
    const siteName =
      (activity.site && String(activity.site).trim()) ||
      `${activity.region || ""} ${activity.title || ""}`.trim() ||
      "Unknown Site";

    const start = d.startTime ?? { hour: 0, minute: 0, second: 0 };
    const end = d.endTime ?? start;

    const detailsCombined = incidentText?.trim()
      ? `${details}\n\n[환경이상/사고 보고]\n${incidentText}`
      : details;

    const drafts =
      attachments.map((f) => ({
        fileName: f.name,
        mimeType: f.type,
        fileSize: n(f.size),
        fileUrl: "(S3 업로드 후 채워짐)",
      })) ?? [];

    return {
      siteName,
      activityType: apiType,
      submittedAt: toLocalDateTimeString(new Date()),
      authorName: "string",
      authorEmail: "string",
      feedbackText: "",
      latitude: n(d.latitude),
      longitude: n(d.longitude),
      basicEnv: {
        recordDate: d.recordDate ?? new Date().toISOString().slice(0, 10),
        startTime: toHHMMSS(start),
        endTime: toHHMMSS(end),
        waterTempC: n(d.waterTempC),
        visibilityM: n(d.visibilityM),
        depthM: n(d.depthM),
        currentState: d.currentState || "LOW",
        weather: "SUNNY",
      },
      participants: {
        leaderName: activity.leader || "Unknown",
        participantCount: n((activity.members?.length ?? 0) + 1, 1),
        role: "CITIZEN_DIVER",
      },
      activity: {
        type: apiType,
        details: detailsCombined,
        collectionAmount: 0,
        durationHours: 0,
      },
      attachments: drafts,
    };
  };

  async function handleSubmit() {
    try {
      // 0) envDraft 복구
      const raw = sessionStorage.getItem(`diveDraft:${id}`);
      const d = raw ? JSON.parse(raw) : {};
      if (DEBUG) console.log("[submit] envDraft =", d);

      // 1) 첨부 업로드
      let uploaded = [];
      if (!TEST_NO_ATTACH) {
        for (const f of attachments) {
          console.log("[upload] start", f.name, f.type, f.size);
          const key = await uploadImage(f);
          const url = keyToPublicUrl(key);
          console.log("[upload] done =>", { key, url });
          uploaded.push({
            fileName: f.name,
            fileUrl: url,
            mimeType: f.type,
            fileSize: n(f.size),
          });
        }
      } else {
        console.warn("[upload] SKIPPED by TEST_NO_ATTACH");
      }

      // 2) details 결합
      const detailsCombined = incidentText?.trim()
        ? `${details}\n\n[환경이상/사고 보고]\n${incidentText}`
        : details;

      // 3) siteName
      const siteName =
        (activity.site && String(activity.site).trim()) ||
        `${activity.region || ""} ${activity.title || ""}`.trim() ||
        "Unknown Site";

      // 4) enum 고정
      const apiType = labelToActivityType(workType);

      // 5) payload (서버 스펙 포맷으로 변환)
      const start = d.startTime ?? { hour: 0, minute: 0, second: 0 };
      const end = d.endTime ?? start;

      const payload = {
        siteName,
        activityType: apiType,
        submittedAt: toLocalDateTimeString(new Date()), // ← Z 없는 로컬 datetime
        authorName: "string",
        authorEmail: "string",
        feedbackText: "",
        latitude: n(d.latitude),
        longitude: n(d.longitude),
        basicEnv: {
          recordDate: d.recordDate ?? new Date().toISOString().slice(0, 10),
          startTime: toHHMMSS(start), // ← "HH:mm:ss"
          endTime: toHHMMSS(end), // ← "HH:mm:ss"
          waterTempC: n(d.waterTempC),
          visibilityM: n(d.visibilityM),
          depthM: n(d.depthM),
          currentState: d.currentState || "LOW",
          weather: "SUNNY",
        },
        participants: {
          leaderName: activity.leader || "Unknown",
          participantCount: n((activity.members?.length ?? 0) + 1, 1),
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

      if (DEBUG) {
        console.log("[submit] payload =", JSON.stringify(payload, null, 2));
      }

      const res = await createSubmission(payload);
      console.log("[submit] response =", res);
      alert("제출 완료!");
      router.replace("/");
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("[submit] ERROR status =", status);
      console.error("[submit] ERROR body   =", data);
      console.error("[submit] ERROR path   =", data?.errors?.path);
      console.error("[submit] ERROR field  =", data?.errors?.field);
      alert(
        status === 500
          ? "서버 500 오류: 콘솔 로그 확인"
          : `제출 실패: ${status ?? ""}`
      );
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-[380px] px-4 py-5">
        {/* 상단 액티비티 요약 pill */}
        <div className="rounded-full border border-sky-200 bg-white px-3 py-2 text-[15px] text-gray-700 flex items-center gap-2 shadow-sm">
          <span className="font-semibold">{activity.title}</span>
          <span className="text-gray-500">{rangeLabel}</span>
          <span className="ml-auto text-sky-500 underline underline-offset-2 cursor-pointer">
            {activity.region}
          </span>
        </div>

        {/* 작업 유형 */}
        <div className="mt-6">
          <div className="text-[15px] font-semibold text-gray-800 mb-2">
            작업 유형
          </div>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[16px] shadow-sm"
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
            >
              <option>이식</option>
              <option>폐기물 수거</option>
              <option>연구</option>
              <option>모니터링</option>
              <option>기타</option>
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              ▾
            </span>
          </div>
        </div>

        {/* 작업 내용 */}
        <div className="mt-6">
          <div className="text-[15px] font-semibold text-gray-800 mb-2">
            작업 내용
          </div>
          <div className="relative">
            <textarea
              className="w-full h-44 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] shadow-sm outline-none"
              placeholder="메시지를 입력해 주세요."
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, DETAILS_MAX))}
              maxLength={DETAILS_MAX}
            />
            <div className="absolute right-4 bottom-3 text-gray-400 text-sm">
              {details.length}/{DETAILS_MAX}
            </div>
          </div>
        </div>

        {/* 환경이상 / 사고 보고 */}
        <div className="mt-6">
          <div className="text-[15px] font-semibold text-gray-800 mb-2">
            환경이상 / 사고 보고
          </div>
          <div className="relative">
            <textarea
              className="w-full h-40 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] shadow-sm outline-none"
              placeholder="발생한 환경 이상 징후나 안전 사고 내용을 상세히 입력해 주세요."
              value={incidentText}
              onChange={(e) =>
                setIncidentText(e.target.value.slice(0, INCIDENT_MAX))
              }
              maxLength={INCIDENT_MAX}
            />
            <div className="absolute right-4 bottom-3 text-gray-400 text-sm">
              {incidentText.length}/{INCIDENT_MAX}
            </div>
          </div>
        </div>

        {/* 활동 사진 및 동영상 */}
        <div className="mt-6">
          <div className="text-[15px] font-semibold text-gray-800 mb-2">
            활동 사진 및 동영상
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
              className="h-20 w-20 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-gray-600 shadow-sm cursor-pointer"
            >
              <span className="text-2xl">📷</span>
              <span className="text-xs mt-1">{attachments.length}/10</span>
            </button>
            <div className="flex flex-wrap gap-2">
              {attachments.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="relative h-20 w-20 overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm"
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
        </div>

        {/* 하단 버튼 */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              const draft = buildPayload();
              console.log("draft payload:", draft);
              alert("임시 저장(콘솔 확인)");
            }}
            className="h-12 rounded-2xl bg-white text-gray-800 font-semibold shadow-sm border border-gray-200"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-12 rounded-2xl bg-[#2F80ED] text-white font-semibold shadow-md hover:brightness-105 disabled:opacity-50"
            disabled={details.length === 0 && incidentText.length === 0}
          >
            제출하기
          </button>
        </div>
      </div>
    </div>
  );
}
