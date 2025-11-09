// api/submissions.ts
import axios, { isAxiosError, type AxiosError } from "axios";
import axiosInstance from "@/utils/axiosInstance";
import type {
  SubmissionCreateRequest,
  SubmissionCreateResponse,
} from "@/types/submissions";

// (선택) 서버 에러 바디 타입이 있으면 여기에 맞춰 정의
interface ApiErrorBody {
  success?: boolean;
  message?: string;
  errorCode?: string;
  // 서버 스키마에 맞게 확장
}

export async function createSubmission(
  payload: SubmissionCreateRequest
): Promise<SubmissionCreateResponse> {
  try {
    console.log(
      "[createSubmission] payload =",
      JSON.stringify(payload, null, 2)
    );

    const { data, status, headers } =
      await axiosInstance.post<SubmissionCreateResponse>(
        "/api/admin/submissions",
        payload
      );

    console.log("[createSubmission] status =", status);
    console.log("[createSubmission] headers =", headers);
    console.log("[createSubmission] data =", data);
    return data;
  } catch (err: unknown) {
    // ✅ any 대신 unknown으로 받고 안전하게 다운캐스팅
    if (isAxiosError<ApiErrorBody>(err)) {
      const ax = err as AxiosError<ApiErrorBody>;
      console.error("[createSubmission] ERROR status =", ax.response?.status);
      console.error("[createSubmission] ERROR data   =", ax.response?.data);
      console.error("[createSubmission] ERROR url    =", ax.config?.url);
      throw ax;
    }
    // AxiosError가 아니면 원본 그대로 다시 던지기
    console.error("[createSubmission] UNKNOWN ERROR =", err);
    throw err;
  }
}
