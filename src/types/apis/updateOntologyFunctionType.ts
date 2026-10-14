import type { CreateOntologyFunctionParameter, CreateOntologyFunctionQueryConfig, CreateOntologyFunctionType } from "./createOntologyFunctionType";

/** 修改函数算子请求参数（与 putFunApi 契约对齐，支持 BASIC_QUERY / CUSTOMIZE）。 */
export interface UpdateOntologyFunctionParams {
  functionApi: string;
  /** 版本号，格式 x.y.z。 */
  version: string;
  displayName: string;
  description: string;
  type: CreateOntologyFunctionType;
  ontologySpaceId: number;
  /** 脚本语言（仅 CUSTOMIZE 有效；创建后不可修改）。 */
  language?: string;
  /** 脚本源码（仅 CUSTOMIZE 有效）。 */
  code?: string;
  /** 脚本入出参定义（仅 CUSTOMIZE 有效）。 */
  parameters?: CreateOntologyFunctionParameter[];
  queryConfig?: CreateOntologyFunctionQueryConfig;
}

/** 修改函数算子响应 data（契约样例无业务载荷）。 */
export type UpdateOntologyFunctionData = null;
