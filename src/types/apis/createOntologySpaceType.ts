/** 本体空间手动创建接口请求参数。 */
export interface CreateOntologySpaceParams {
  displayName: string;
  apiName: string;
  iconUrl?: string;
  description?: string;
}

/** 本体空间手动创建接口响应 data：新创建空间 id。 */
export type CreateOntologySpaceData = number;
