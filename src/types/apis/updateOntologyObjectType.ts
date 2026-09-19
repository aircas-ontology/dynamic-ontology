/** 修改本体对象请求参数。 */
export interface UpdateOntologyObjectParams {
  ontologyIdentifier: string;
  displayName: string;
  groupIds: string[];
  icon?: string;
  description?: string;
  categoryId?: number;
}

/** 修改本体对象响应 data；在线契约未定义具体字段。 */
export type UpdateOntologyObjectData = Record<string, unknown>;
