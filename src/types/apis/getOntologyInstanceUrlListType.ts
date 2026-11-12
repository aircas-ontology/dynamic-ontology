/** 查询实例 URL 请求参数。 */
export interface GetOntologyInstanceUrlListParams {
  /** 对象空间 id。 */
  spaceId: number;
  /** 对象唯一标识（ontology_meta.unique_identifier）。 */
  objectId?: string;
  /** 实例 id（实例主键值）。 */
  instanceId?: string;
}

/** 实例 URL 记录。 */
export interface OntologyInstanceUrlItem {
  /** 主键 id。 */
  id?: number;
  /** 所属对象空间 id。 */
  spaceId?: number;
  /** 对象唯一标识。 */
  objectId?: string;
  /** 实例 id（实例主键值）。 */
  instanceId?: string;
  /** 实例对应的 URL。 */
  url?: string;
  /** 存入时间。 */
  createTime?: string;
}

/** 查询实例 URL 响应 data。 */
export type GetOntologyInstanceUrlListData = OntologyInstanceUrlItem[];
