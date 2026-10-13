/** 根据函数 API 查询版本号列表的请求参数。 */
export interface GetOntologyFunctionVersionsParams {
  /** 函数 API 名称。 */
  functionApi: string;
}

/** 根据函数 API 查询版本号列表的响应 data。 */
export type GetOntologyFunctionVersionsData = string[];
