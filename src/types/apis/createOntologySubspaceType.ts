/** 子空间属性筛选操作符。 */
export type OntologySubspacePropertyFilterOp =
  | "EQ"
  | "NE"
  | "LIKE"
  | "LIKE_LEFT"
  | "LIKE_RIGHT"
  | "IN"
  | "NOT_IN"
  | "BETWEEN"
  | "NOT_BETWEEN"
  | "GT"
  | "GE"
  | "LT"
  | "LE"
  | "IS_NULL"
  | "IS_NOT_NULL"
  | "APPLY";

/** 子空间属性数据类型。 */
export type OntologySubspacePropertyDataType = string;

/** 子空间属性筛选值。 */
export type OntologySubspacePropertyFilterValue = string | number | boolean | Array<string | number | boolean>;

/** 子空间创建请求中的属性筛选条件。 */
export interface OntologySubspacePropertyFilterConfig {
  op: OntologySubspacePropertyFilterOp;
  value?: OntologySubspacePropertyFilterValue | null;
  dataType: OntologySubspacePropertyDataType;
}

/** 子空间创建请求中的属性筛选条件兼容名称。 */
export type CreateOntologySubspacePropertyFilter = OntologySubspacePropertyFilterConfig;

/** 子空间创建请求中的对象属性。 */
export interface CreateOntologySubspaceSelectedProperty {
  sourcePropertyUniqueIdentifier: string;
  filter?: CreateOntologySubspacePropertyFilter | null;
}

/** 子空间创建请求中的对象配置。 */
export interface CreateOntologySubspaceSelectedOntology {
  sourceOntologyUniqueIdentifier: string;
  selectedInstancePrimaryKeys?: Array<string | number>;
  selectedProperties: CreateOntologySubspaceSelectedProperty[];
}

/** 子空间创建请求中的关系配置。 */
export interface CreateOntologySubspaceSelectedLink {
  sourceLinkUniqueIdentifier: string;
  name?: string;
  apiName?: string;
  type?: string;
  description?: string;
}

/** 接口文档中的对象选择类型别名。 */
export type OntologySubspaceOntologySelection = CreateOntologySubspaceSelectedOntology;

/** 接口文档中的属性选择类型别名。 */
export type OntologySubspacePropertySelection = CreateOntologySubspaceSelectedProperty;

/** 接口文档中的关系选择类型别名。 */
export type OntologySubspaceLinkSelection = CreateOntologySubspaceSelectedLink;

/** 子空间创建结果。 */
export interface OntologySubspaceCreateVO {
  spaceId: number;
  ontologyMapping: Record<string, string>;
  linkMapping: Record<string, string>;
}

/** 创建子空间接口请求参数。 */
export interface CreateOntologySubspaceParams {
  parentSpaceId: number;
  displayName: string;
  apiName: string;
  description?: string;
  iconUrl?: string;
  selectedOntologies: CreateOntologySubspaceSelectedOntology[];
  selectedLinks?: CreateOntologySubspaceSelectedLink[];
}

/** 创建子空间接口响应 data。 */
export type CreateOntologySubspaceData = OntologySubspaceCreateVO;
