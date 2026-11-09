/** 实体属性行分页查询请求体。 */
export interface GetOntologyEntityRowDetailPageParams {
  /** 对象 id。 */
  ontologyUniqueIdentifier?: string;
  /** 实体主键值。 */
  entityPrimaryKey: string | number | boolean | Record<string, unknown>;
  /** 排序规则：ASC / DESC。 */
  sort: "ASC" | "DESC";
  /** 属性存储分组名称，与 row_detail 返回的 propertyGroups[].storageGroup 一致。 */
  storageGroup: string;
  /** 分页号，默认 1。 */
  pageNum?: number;
  /** 每页条数，默认 10。 */
  pageSize?: number;
}

/** 分页属性行内单条属性信息。 */
export interface OntologyEntityRowDetailPagePropertyInfo {
  /** 属性唯一标识。 */
  propertyUniqIdentifier?: string;
  /** 属性 api 名称。 */
  propertyApiName: string;
  /** 属性显示名称。 */
  propertyDisplayName?: string;
  /** 属性值。 */
  propertyValue: unknown;
  /** 属性分类 id。 */
  categoryId?: number | null;
}

/** 分页属性行单条记录。 */
export interface OntologyEntityRowDetailPageRecord {
  /** 数据主键。 */
  dataPrimaryKey?: unknown;
  /** 属性信息列表。 */
  props?: OntologyEntityRowDetailPagePropertyInfo[];
}

/** 实体属性行分页数据。 */
export interface OntologyEntityRowDetailPageData {
  /** 当前页属性行列表。 */
  records?: OntologyEntityRowDetailPageRecord[];
  /** 总行数。 */
  total?: number;
  /** 每页条数。 */
  size?: number;
  /** 当前页号。 */
  current?: number;
  /** 已废弃。 */
  pages?: number;
}

/** 实体属性行分页查询响应 data。 */
export type GetOntologyEntityRowDetailPageData = OntologyEntityRowDetailPageData | null;
