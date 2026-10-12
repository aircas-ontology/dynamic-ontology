/** 下线函数请求参数。 */
export interface FunctionUnpublishParams {
  /** 函数 API 名称。 */
  functionApi: string;
  /** 版本号，格式 x.y.z。 */
  version: string;
}

/** 下线函数响应 data（无业务载荷）。 */
export type FunctionUnpublishData = null;
