/** 本体空间编辑接口请求参数。 */
export interface UpdateOntologySpaceParams {
  displayName: string;
  spaceId: number;
  iconUrl?: string;
  description?: string;
}

/** 本体空间编辑接口响应 data：空对象。 */
export type UpdateOntologySpaceData = Record<string, unknown>;
