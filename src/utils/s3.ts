// utils/s3.ts
export function keyToPublicUrl(key: string) {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE?.replace(/\/+$/, "");
  return base ? `${base}/${key}` : key; // base가 없으면 일단 key를 그대로(테스트 시엔 attachments 비우는 게 안전)
}
