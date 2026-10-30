/** 全局检索请求与响应条目类型（契约：/ontology/search/global）。 */

/** 检索类型：1=空间（含主题） 2=本体对象 3=关系 4=属性 5=实例。 */
export type OntologyGlobalSearchTypeCode = 1 | 2 | 3 | 4 | 5;

/** 全局检索类型筛选项（value 为空字符串表示五类全查，请求不传 searchType）。 */
export interface OntologyGlobalSearchTypeOption {
  value: OntologyGlobalSearchTypeCode | "";
  label: string;
}

/** 全局检索类型下拉选项。 */
export const ONTOLOGY_GLOBAL_SEARCH_TYPE_OPTIONS: ReadonlyArray<OntologyGlobalSearchTypeOption> = [
  { value: "", label: "全部" },
  { value: 1, label: "空间" },
  { value: 2, label: "对象" },
  { value: 3, label: "关系" },
  { value: 4, label: "属性" },
  { value: 5, label: "实例" },
];

/**
 * 全局检索请求参数。
 * 字段名 `sizs` 与后端契约保持一致。
 */
export interface OntologyGlobalSearchParams {
  /** 查询内容（必填）。 */
  keyword: string;
  /** 检索类型；不传则五类全查。 */
  searchType?: OntologyGlobalSearchTypeCode;
  /** 返回条数上限，缺省由后端按 100 处理。 */
  sizs?: number;
}

/** 检索结果所属空间类型：对象空间或主题空间。 */
export type OntologySpaceType = 0 | 1;

/** 全局检索单条结果。 */
export interface OntologyGlobalSearchItem {
  /** 名称（必返回）。 */
  name: string;
  /** 类型（必返回），如「空间」「对象」。 */
  type: string;
  /** 所属空间类型：0 对象空间，1 主题空间。 */
  spaceType?: OntologySpaceType;
  /** 描述（可选）。 */
  desc?: string;
  /** 空间 id；空间/对象等类型时返回。 */
  spaceId?: number;
  /** 空间名称；对象/属性/关系分组等类型时返回。 */
  spaceName?: string;
  /** 对象唯一标识；对象类型跳转路径参数。 */
  uniqueIdentifier?: string;
  /** 所属对象唯一标识；属性类型跳转路径参数。 */
  ontologyUniqueIdentifier?: string;
  /** 所属对象名称；属性类型时返回，用于 query.objectName。 */
  ontologyName?: string;
  /** 对象 id。 */
  objectId?: number;
  /** 属性 id。 */
  propertyId?: number;
  /** 实例 id。 */
  instanceId?: string;
}

/** 全局检索响应 data：结果数组。 */
export type OntologyGlobalSearchData = OntologyGlobalSearchItem[];
