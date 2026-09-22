/**
 * 本体应用管理 OpenAPI 文档（SpringDoc `/v3/api-docs`）相关类型。
 * 响应为裸 OpenAPI 文档，不包裹项目标准 ApiResponse。
 */

/** OpenAPI 文档 info 段。 */
export interface OntologyApiDocsInfo {
  title: string;
  description?: string;
  version: string;
  [key: string]: unknown;
}

/** OpenAPI servers 项。 */
export interface OntologyApiDocsServer {
  url: string;
  description?: string;
  [key: string]: unknown;
}

/** OpenAPI tags 项。 */
export interface OntologyApiDocsTag {
  name: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * OpenAPI path item：键为 HTTP 方法或 parameters 等扩展字段。
 * 值为 unknown，以便完整承接 SpringDoc 输出而不强制断言。
 */
export type OntologyApiDocsPathItem = Record<string, unknown>;

/** OpenAPI components 段。 */
export interface OntologyApiDocsComponents {
  schemas?: Record<string, unknown>;
  securitySchemes?: Record<string, unknown>;
  [key: string]: unknown;
}

/** GET `/ontology/v3/api-docs/ontology` 返回的 OpenAPI 文档主体。 */
export interface OntologyApiDocsData {
  openapi: string;
  info: OntologyApiDocsInfo;
  servers?: OntologyApiDocsServer[];
  tags?: OntologyApiDocsTag[];
  paths: Record<string, OntologyApiDocsPathItem>;
  components?: OntologyApiDocsComponents;
  [key: string]: unknown;
}
