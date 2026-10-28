/** 创建与响应均使用服务端 FunctionRateLimitTemplate 模型，文档未声明字段必填。 */
export interface CreateFunctionRateLimitTemplateParams {
  id?: number;
  name?: string;
  timeoutMs?: number;
  retryCount?: number;
  retryIntervalMs?: number;
  tpsLimit?: number;
  maxConcurrency?: number;
  /** 0 禁用，1 启用。 */
  enabled?: number;
  createTime?: string;
  updateTime?: string;
}
export type CreateFunctionRateLimitTemplateData = CreateFunctionRateLimitTemplateParams;
