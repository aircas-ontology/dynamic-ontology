/** 基础查询算子聚合类型。 */
export type CreateOntologyFunctionAggFunc = "SUM" | "COUNT" | "AVG" | "MAX" | "MIN" | "DISTINCT";

/** 基础查询过滤条件数据类型。 */
export type CreateOntologyFunctionFilterDataType = "STRING" | "NUMBER" | "BOOLEAN";

/** 基础查询单条过滤条件。 */
export interface CreateOntologyFunctionFilterCondition {
  propertyApiName: string;
  op: string;
  dataType: CreateOntologyFunctionFilterDataType;
  value?: string | number | boolean;
  values?: Array<string | number | boolean>;
}

/** 基础查询过滤节点。 */
export interface CreateOntologyFunctionFilterNode {
  type: "FILTER" | "GROUP";
  filter?: CreateOntologyFunctionFilterCondition;
  group?: CreateOntologyFunctionFilters;
}

/** 基础查询 filters 对象。 */
export interface CreateOntologyFunctionFilters {
  logic: "AND" | "OR";
  children: CreateOntologyFunctionFilterNode[];
}

/** 基础查询算子 queryConfig。 */
export interface CreateOntologyFunctionQueryConfig {
  filters: CreateOntologyFunctionFilters;
  aggFunc?: CreateOntologyFunctionAggFunc;
}

/** 创建函数算子请求参数。 */
export interface CreateOntologyFunctionParams {
  functionApi: string;
  displayName: string;
  description: string;
  type: "BASIC_QUERY";
  ontologySpaceId: number;
  queryConfig?: CreateOntologyFunctionQueryConfig;
}

/** 创建函数算子响应 data（契约样例无业务载荷）。 */
export type CreateOntologyFunctionData = null;
