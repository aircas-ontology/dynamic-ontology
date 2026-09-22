/** 应用管理页：接口文档展示用视图模型。 */

/** 支持展示的 HTTP 方法。 */
export type ApiDocsHttpMethod = "get" | "post" | "put" | "delete" | "patch" | "head" | "options" | "trace";

/** 左侧列表中的单条接口操作。 */
export interface ApiDocsEndpointItem {
  /** 稳定唯一键：method + path。 */
  id: string;
  method: ApiDocsHttpMethod;
  path: string;
  summary: string;
  operationId: string;
  tags: string[];
  deprecated: boolean;
}

/** 左侧按 tag 分组后的接口列表。 */
export interface ApiDocsEndpointGroup {
  tag: string;
  endpoints: ApiDocsEndpointItem[];
}

/** 参数展示行。 */
export interface ApiDocsParameterRow {
  name: string;
  location: string;
  typeLabel: string;
  required: boolean;
  description: string;
}

/** 响应 / 请求体 Schema 字段行（树形，children 表示嵌套）。 */
export interface ApiDocsSchemaFieldRow {
  /** 树节点唯一键，通常为完整路径。 */
  id: string;
  /** 当前层级显示名（不含父路径）。 */
  name: string;
  /** 完整路径，用于提示。 */
  path: string;
  typeLabel: string;
  required: boolean;
  description: string;
  children?: ApiDocsSchemaFieldRow[];
}

/** 响应摘要行。 */
export interface ApiDocsResponseRow {
  status: string;
  description: string;
  contentTypes: string[];
  schemaLabel: string;
  schemaFields: ApiDocsSchemaFieldRow[];
}

/** 选中接口的详情视图模型。 */
export interface ApiDocsEndpointDetail {
  id: string;
  method: ApiDocsHttpMethod;
  path: string;
  summary: string;
  description: string;
  operationId: string;
  tags: string[];
  deprecated: boolean;
  parameters: ApiDocsParameterRow[];
  requestBodyRequired: boolean;
  requestBodyContentTypes: string[];
  requestBodySchemaLabel: string;
  responses: ApiDocsResponseRow[];
}

/** 文档页顶栏服务信息。 */
export interface ApiDocsServiceInfo {
  title: string;
  description: string;
  version: string;
  openapi: string;
  serverUrl: string;
  serverDescription: string;
}
