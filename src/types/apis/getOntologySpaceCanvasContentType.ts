import type { CreateOntologySpaceWithCanvasContentParams } from "./createOntologySpaceWithCanvasContentType";

/** 查询已有对象空间画布内容的请求参数。 */
export interface GetOntologySpaceCanvasContentParams {
  spaceId: number;
}

/** 查询已有对象空间画布内容的响应数据。 */
export type GetOntologySpaceCanvasContentData = CreateOntologySpaceWithCanvasContentParams;
