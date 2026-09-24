import type { CreateOntologyFunctionQueryConfig } from "./createOntologyFunctionType";

/** 根据函数 API 查询详情的请求参数。 */
export interface GetOntologyFunctionDetailParams {
  /** 函数 API 名称。 */
  functionApi: string;
}

/** 函数详情参数项。 */
export interface GetOntologyFunctionDetailParamItem {
  paramId: number;
  paramName: string;
  paramType: string;
  category: string;
  paramOrder: number;
  description: string;
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
  params: GetOntologyFunctionDetailParamItem[];
  /** queryConfig 的 JSON 字符串（与响应码 code 同名，类型为 string）。 */
  code: string;
  queryConfig?: CreateOntologyFunctionQueryConfig;
}
