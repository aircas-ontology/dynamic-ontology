/** 根据函数 API 查询版本号列表的请求参数。 */
export interface GetOntologyFunctionVersionsParams {
  /** 函数 API 名称。 */
  functionApi: string;
  /** 本体空间 id：跨空间允许同名 api，带上可精确定位。 */
  spaceId?: number;
}

/** 根据函数 API 查询版本号列表的响应 data。 */
export type GetOntologyFunctionVersionsData = string[];
