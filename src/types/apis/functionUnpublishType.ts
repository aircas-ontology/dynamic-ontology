/** 下线函数请求参数。 */
export interface FunctionUnpublishParams {
  /** 函数 API 名称。 */
  functionApi: string;
  /** 版本号，格式 x.y.z。 */
  version: string;
  /** 本体空间 id：跨空间允许同名 api，带上可精确定位。 */
  spaceId?: number;
}

/** 下线函数响应 data（无业务载荷）。 */
export type FunctionUnpublishData = null;
