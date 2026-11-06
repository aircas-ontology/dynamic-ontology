/** 撤销发布本体行为请求参数（query 参数）。 */
export interface UnpublishOntologyActionParams {
  /** 本体空间 id。 */
  ontologySpaceId: number;
  /** 行为 api。 */
  actionApi: string;
}

/** 撤销发布本体行为响应 data（文档样例为空数组）。 */
export type UnpublishOntologyActionData = unknown[];
