/** 全局检索请求与响应条目类型（契约：/ontology/search/global）。 */

/**
 * 全局检索请求参数。
 * 字段名 `sizs` 与后端契约保持一致。
 */
export interface OntologyGlobalSearchParams {
  /** 查询内容（必填）。 */
  keyword: string;
  /** 返回条数上限，缺省由后端按 100 处理。 */
  sizs?: number;
}

/** 全局检索单条结果。 */
export interface OntologyGlobalSearchItem {
  /** 名称（必返回）。 */
  name: string;
  /** 类型（必返回），如「空间」「对象」。 */
  type: string;
  /** 描述（可选）。 */
  desc?: string;
  /** 空间 id；空间/对象等类型时返回。 */
  spaceId?: number;
  /** 对象 id。 */
  objectId?: number;
  /** 属性 id。 */
  propertyId?: number;
  /** 实例 id。 */
  instanceId?: string;
}

/** 全局检索响应 data：结果数组。 */
export type OntologyGlobalSearchData = OntologyGlobalSearchItem[];
