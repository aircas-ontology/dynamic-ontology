/** 删除本体行为请求参数（query 参数）。 */
export interface DeleteOntologyActionParams {
  /** 本体空间 id。 */
  ontologySpaceId: string;
  /** 行为 api。 */
  actionApi: string;
}

/** 删除本体行为响应 data（无业务载荷）。 */
export type DeleteOntologyActionData = null;
