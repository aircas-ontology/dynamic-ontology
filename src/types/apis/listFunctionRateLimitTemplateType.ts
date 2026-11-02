import type { CreateFunctionRateLimitTemplateData } from "./createFunctionRateLimitTemplateType";
export interface ListFunctionRateLimitTemplateParams {
  enabled?: number;
}
export type ListFunctionRateLimitTemplateItem = CreateFunctionRateLimitTemplateData;
export type ListFunctionRateLimitTemplateData = ListFunctionRateLimitTemplateItem[];
