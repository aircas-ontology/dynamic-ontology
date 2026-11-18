/** 修改对象请求参数。 */
export interface UpdateOntologyObjectParams {
  ontologyIdentifier: string;
  displayName: string;
  groupIds: Array<string | null>;
  /** 未关联数据源时可修改的对象 API 名称。 */
  apiName?: string;
  icon?: string;
  description?: string;
  categoryId?: number;
}

/** 修改对象响应 data；在线契约未定义具体字段。 */
export type UpdateOntologyObjectData = Record<string, unknown>;
