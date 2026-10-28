import type { OntologyCompositeConfig } from "./ontologyCompositeConfigType";

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
  /** 过滤条件；无条件时不传。 */
  filters?: CreateOntologyFunctionFilters;
  aggFunc?: CreateOntologyFunctionAggFunc;
  /** 目标占位符名；未传时后端可自动生成为 target。 */
  targetProperty?: string;
}

/** 创建函数算子类型。 */
export type CreateOntologyFunctionType = "BASIC_QUERY" | "CUSTOMIZE" | "EXTERNAL" | "COMPOSITE";

/** 外部 API 参数树节点（可嵌套 fields）。 */
export interface CreateOntologyFunctionApiField {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  /** type 为 object 时的下级属性；非 object 不提交。 */
  fields?: CreateOntologyFunctionApiField[];
}

/** 外部 API 输入参数；仅顶层含 location / required。 */
export interface CreateOntologyFunctionApiInput extends CreateOntologyFunctionApiField {
  required: boolean;
  location: "body" | "path" | "query" | "header";
}

/** 外部 API 输出参数。 */
export interface CreateOntologyFunctionApiOutput extends CreateOntologyFunctionApiField {}

/** 外部 API 算子 apiConfig。 */
export interface CreateOntologyFunctionApiConfig {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  authType: "none" | "apiKey";
  contentType: "application/json";
  /** 认证 Header 名；仅 authType 为 apiKey 时提交。 */
  apiKeyHeader?: string;
  /** 认证 Header 值；仅 authType 为 apiKey 时提交。 */
  apiKey?: string;
  inputs: CreateOntologyFunctionApiInput[];
  outputs: CreateOntologyFunctionApiOutput[];
}

/** 脚本函数参数方向。 */
export type CreateOntologyFunctionParameterCategory = "INPUT" | "OUTPUT";

/** 脚本函数参数类型。 */
export type CreateOntologyFunctionParameterType = "STRING" | "NUMBER" | "BOOLEAN" | "OBJECT";

/** CUSTOMIZE 脚本函数参数项，结构与解析接口参数树一致。 */
export interface CreateOntologyFunctionParameter {
  paramName: string;
  /** 参数类型，保留解析结果原值，如 STRING、DOUBLE、LIST、OBJECT。 */
  paramType: string;
  category: CreateOntologyFunctionParameterCategory;
  /** 同层顺序，从 1 开始。 */
  paramOrder: number;
  /** 引用类型；无引用时为空字符串。 */
  referenceType: string;
  /** 对象或列表的下级属性。 */
  fields?: CreateOntologyFunctionParameter[];
}

/** 创建函数算子请求参数。 */
export interface CreateOntologyFunctionParams {
  functionApi: string;
  /** 版本号，格式 x.y.z。 */
  version: string;
  displayName: string;
  description: string;
  type: CreateOntologyFunctionType;
  ontologySpaceId: number;
  /** 脚本语言（仅 CUSTOMIZE 有效）。 */
  language?: string;
  /** 脚本源码（仅 CUSTOMIZE 有效）。 */
  code?: string;
  /** 脚本入出参定义（仅 CUSTOMIZE 有效）。 */
  parameters?: CreateOntologyFunctionParameter[];
  /**
   * 是否基于旧版本创建（true: 允许相同 api 但 api+version 不重复；false/null: 全新创建，api 不能重复）。
   */
  basedOnOldVersion?: boolean;
  queryConfig?: CreateOntologyFunctionQueryConfig;
  /** 外部 API 配置（仅 EXTERNAL 有效）。 */
  apiConfig?: CreateOntologyFunctionApiConfig;
  /** 函数编排配置（仅 COMPOSITE 有效；后端 compositeConfig 契约）。 */
  compositeConfig?: OntologyCompositeConfig;
  /** 限流配置模板 ID；不传则使用默认模板，创建后不可修改。 */
  rateLimitTemplateId?: number;
}

/** 创建函数算子响应 data（契约样例无业务载荷）。 */
export type CreateOntologyFunctionData = null;
