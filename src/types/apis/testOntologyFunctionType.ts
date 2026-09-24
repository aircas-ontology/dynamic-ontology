/** 算子函数测试请求参数。 */
export interface TestOntologyFunctionParams {
  /** 函数 API 名称。 */
  functionApi: string;
  /** 本体唯一标识。 */
  ontologyIdentifier: string;
  /** 查询参数绑定：键为详情 params.paramName，值为属性 apiName。 */
  variableBindings: Record<string, string>;
  /** 页码，从 1 开始，默认 1。 */
  pageNum?: number;
  /** 每页条数，默认 10。 */
  pageSize?: number;
}

/** 算子函数测试响应 data；契约输出暂未知，成功样例按 null。 */
export type TestOntologyFunctionData = null;
