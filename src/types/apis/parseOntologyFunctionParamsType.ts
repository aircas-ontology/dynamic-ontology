/** 解析脚本输入/输出参数的请求体。 */
export interface ParseOntologyFunctionParamsParams {
  /** 脚本语言：GROOVY / JAVA / PYTHON / TYPESCRIPT。 */
  language: string;
  /** 脚本代码。 */
  code: string;
}

/** 解析得到的单个参数。 */
export interface ParseOntologyFunctionParamItem {
  /** 参数名。 */
  paramName: string;
  /** 参数类型，如 STRING、DOUBLE、BOOL。 */
  paramType: string;
  /** 参数类别：INPUT 或 OUTPUT。 */
  category: string;
  /** 同类别内顺序，从 1 开始。 */
  paramOrder: number;
  /** 引用类型；无引用时为空字符串。 */
  referenceType: string;
  /** 参数说明；详情回填时写入，解析接口可能缺省。 */
  description?: string;
  /** 对象或列表的下级属性；无下级时省略。 */
  fields?: ParseOntologyFunctionParamItem[];
}

/** 解析脚本输入/输出参数的响应 data。 */
export interface ParseOntologyFunctionParamsData {
  /** 解析状态，成功样例为 OK。 */
  status: string;
  /** 是否解析成功。 */
  parsed: boolean;
  /** 解析出的输入/输出参数。 */
  parameters: ParseOntologyFunctionParamItem[];
}
