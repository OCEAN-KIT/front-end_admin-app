// types/submission.ts

/** Swagger 스키마 기준 Enum */
export type ActivityType = "URCHIN_REMOVAL" | "MONITORING" | "ALGAE_TRANSPLANT";
export type CurrentState = "LOW" | "MEDIUM" | "HIGH";
export type Weather = "SUNNY" | "CLOUDY" | "RAINY" | "WINDY" | "FOGGY"; // 필요에 맞게 확장
export type ParticipantRole = "CITIZEN_DIVER" | "RESEARCHER" | "LEADER"; // 필요에 맞게 확장

export interface LocalTime {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

export interface BasicEnv {
  recordDate: string; // "YYYY-MM-DD"
  startTime: LocalTime;
  endTime: LocalTime;
  waterTempC: number;
  visibilityM: number;
  depthM: number;
  currentState: CurrentState;
  weather: Weather;
}

export interface Participants {
  leaderName: string;
  participantCount: number;
  role: ParticipantRole;
}

export interface ActivityBlock {
  type: ActivityType;
  /** 작업 내용 + (선택) 환경이상/사고보고를 합쳐서 들어가는 본문 */
  details: string;
  collectionAmount: number;
  durationHours: number;
}

export interface Attachment {
  fileName: string;
  fileUrl: string; // S3 key 또는 공개 URL
  mimeType: string;
  fileSize: number;
}

export interface SubmissionCreateRequest {
  siteName: string;
  activityType: ActivityType;
  submittedAt: string; // ISO
  authorName: string;
  authorEmail: string;
  feedbackText: string;
  latitude: number;
  longitude: number;
  basicEnv: BasicEnv;
  participants: Participants;
  activity: ActivityBlock;
  attachments: Attachment[];
}

/** (선택) 서버 응답이 있다면 여기에 정의 */
export interface SubmissionCreateResponse {
  id: string;
  createdAt: string;
  // ...백엔드 응답 스키마에 맞게 확장
}
