/** 分页查询空间内关系请求参数。 */
export interface GetOntologyLinkListParams {
  /** 对象空间 id。 */
  spaceId: number;
  /** 关系名称，模糊匹配；不传则查询全部。 */
  relationName?: string;
  /** 页码，从 1 开始；默认 1。 */
  pageNum?: number;
  /** 每页条数；默认 10。 */
  pageSize?: number;
}

/** 关系两端对象摘要。 */
export interface GetOntologyLinkListObject {
  /** 对象唯一标识。 */
  uniqueIdentifier: string;
  /** 创建时间。 */
  createTime: string;
  /** 更新时间。 */
  updateTime: string;
  /** 最近查询时间。 */
  latestQueryTime: string;
  /** 对象显示名称。 */
  displayName: string;
  /** 对象描述。 */
  description: string;
  /** 对象 api 名称。 */
  apiName: string;
  /** 元数据分组 id 列表。 */
  metaGroupId: number[];
  /** 所属空间 id。 */
  spaceId: number;
  /** 对象分类 id。 */
  ontologyCategoryId: number;
}

/** 关系列表单条记录。 */
export interface GetOntologyLinkListRecord {
  /** 关系唯一标识。 */
  uniqueIdentifier: string;
  /** 关系名称。 */
  name: string;
  /** 关系源端对象。 */
  fromObject: GetOntologyLinkListObject;
  /** 关系目标端对象。 */
  toObject: GetOntologyLinkListObject;
}

/** 分页查询空间内关系业务数据。 */
export interface GetOntologyLinkListData {
  /** 当前页码。 */
  current: number;
  /** 总页数。 */
  pages: number;
  /** 每页条数。 */
  size: number;
  /** 总条数。 */
  total: number;
  /** 关系列表。 */
  records: GetOntologyLinkListRecord[];
}
