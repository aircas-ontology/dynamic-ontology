import type { ApiResponse, ListFunctionRateLimitTemplateData } from "@/types";
export const listFunctionRateLimitTemplateMock: ApiResponse<ListFunctionRateLimitTemplateData> = {
  code: 200,
  success: true,
  message: "SUCCESS",
  data: [
    {
      id: 1,
      name: "标准",
      timeoutMs: 5000,
      retryCount: 2,
      retryIntervalMs: 300,
      tpsLimit: 600,
      maxConcurrency: 80,
      enabled: 1,
      createTime: "2026-10-26T16:00:00+08:00",
      updateTime: "2026-10-26T16:00:00+08:00",
    },
  ],
};
