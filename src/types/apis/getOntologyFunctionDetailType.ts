import type { CreateOntologyFunctionQueryConfig } from "./createOntologyFunctionType";

/** 根据函数 API 查询详情的请求参数。 */
export interface GetOntologyFunctionDetailParams {
  /** 函数 API 名称。 */
  functionApi: string;
  /** 版本号。 */
  version: string;
}

/** 函数详情参数项。 */
export interface GetOntologyFunctionDetailParamItem {
  paramId: number;
  paramName: string;
  paramType: string;
  category: string;
  paramOrder: number;
  /** 参数说明；脚本函数示例可能缺省。 */
  description?: string;
  /** 参数角色：FILTER / AGGREGATION 等。 */
  paramRole?: string;
}

/** 根据函数 API 查询详情的响应 data。 */
export interface GetOntologyFunctionDetailData {
  functionApi: string;
  displayName: string;
  description: string;
  model: string;
  type: string;
  ontologySpaceId: number;
  /** 版本号，格式 x.y.z；部分环境可能未返回。 */
  version?: string;
  /** 发布状态；脚本详情示例可能返回。 */
  publishStatus?: number;
  /** 脚本语言（如 TYPESCRIPT）；仅 CUSTOMIZE 等脚本类型有效。 */
  language?: string;
  params: GetOntologyFunctionDetailParamItem[];
  /**
   * 与响应码 code 同名的业务字段：
   * 基础函数多为 queryConfig 的 JSON 字符串；脚本函数为源码文本。
   */
  code: string;
  queryConfig?: CreateOntologyFunctionQueryConfig;
}
