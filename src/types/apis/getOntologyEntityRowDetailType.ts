/** 实体属性行详情查询请求体。 */
export interface GetOntologyEntityRowDetailParams {
  /** 对象唯一标识。 */
  ontologyUniqueIdentifier: string;
  /** 实体主键。 */
  entityPrimaryKey: string | number | boolean | Record<string, unknown>;
  /** 动态属性行排序：ASC / DESC。 */
  sort: "ASC" | "DESC";
}

/** 属性行内单条属性信息。 */
export interface OntologyEntityRowPropertyInfo {
  propertyUniqIdentifier: string;
  propertyApiName: string;
  propertyDisplayName: string;
  propertyValue: unknown;
  categoryId?: number | null;
  metadata?: unknown;
}

/** 存储分组下的一行数据。 */
export interface OntologyEntityRowPropertyGroupData {
  dataPrimaryKey: unknown;
  props: OntologyEntityRowPropertyInfo[];
}

/** 按存储分组聚合的属性数据。 */
export interface OntologyEntityRowPropertyGroup {
  storageGroup: string;
  groupDataList: OntologyEntityRowPropertyGroupData[];
}

/** 实体属性行详情。 */
export interface OntologyEntityRowDetailVO {
  primaryKey: unknown;
  ontologyUniqueIdentifier: string;
  propertyGroups: OntologyEntityRowPropertyGroup[];
}

/** 实体属性行详情响应 data；文档样例可为 null。 */
export type GetOntologyEntityRowDetailData = OntologyEntityRowDetailVO | null;
