/** 算子函数测试请求中的脚本/外部参数项。 */
export interface TestOntologyFunctionParameterItem {
  /** 参数名。 */
  paramName: string;
  /** 叶子参数值（按字符串提交）。有下级时省略。 */
  paramValue?: string;
  /** 下级参数。无下级时省略。 */
  fields?: TestOntologyFunctionParameterItem[];
}

/** 算子函数测试请求参数。 */
export interface TestOntologyFunctionParams {
  /** 函数 API 名称。 */
  functionApi: string;
  /** 版本号，格式 x.y.z。 */
  version: string;
  /** 本体唯一标识；BASIC_QUERY 必填，CUSTOMIZE 可不传。 */
  ontologyIdentifier?: string;
  /** 查询参数绑定：键为详情 params.paramName，值为属性 apiName；BASIC_QUERY 使用。 */
  variableBindings?: Record<string, string>;
  /** CUSTOMIZE/EXTERNAL 类型入参列表。 */
  parameters?: TestOntologyFunctionParameterItem[];
  /** 页码，从 1 开始，默认 1。 */
  pageNum?: number;
  /** 每页条数，默认 10。 */
  pageSize?: number;
}

/** 算子函数测试响应 data；契约输出暂未知，成功样例按 null。 */
export type TestOntologyFunctionData = null;
