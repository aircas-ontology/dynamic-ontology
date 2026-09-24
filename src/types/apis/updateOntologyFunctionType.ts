import type { CreateOntologyFunctionQueryConfig } from "./createOntologyFunctionType";

/** 修改函数算子请求参数。 */
export interface UpdateOntologyFunctionParams {
  functionApi: string;
  displayName: string;
  description: string;
  type: "BASIC_QUERY";
  ontologySpaceId: number;
  queryConfig?: CreateOntologyFunctionQueryConfig;
}

/** 修改函数算子响应 data（契约样例无业务载荷）。 */
export type UpdateOntologyFunctionData = null;
