// utils/axiosInstance.ts
import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

const SHOULD_FORCE = process.env.NEXT_PUBLIC_USE_DEV_BEARER === "1";
const DEV_BEARER = process.env.NEXT_PUBLIC_DEV_BEARER ?? "";

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isInternalApi =
    typeof config.url === "string" &&
    (config.url.startsWith("/api/admin") || config.url.startsWith("/api/user"));

  // headers를 AxiosHeaders로 보장 (any 사용 X)
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);

  if (
    SHOULD_FORCE &&
    isInternalApi &&
    DEV_BEARER &&
    !headers.has("Authorization")
  ) {
    headers.set("Authorization", `Bearer ${DEV_BEARER}`);
  }

  config.headers = headers;
  return config;
});

export default axiosInstance;
