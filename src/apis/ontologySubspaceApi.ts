import type { ApiResponse, CreateOntologySubspaceData, CreateOntologySubspaceParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 创建对象子空间。
 * 请求方式：POST `/ontology/space/subspace`
 * @param params 子空间创建请求参数。
 * @returns 标准 API 响应。
 */
export function createOntologySubspaceInterface(params: CreateOntologySubspaceParams): Promise<ApiResponse<CreateOntologySubspaceData>> {
  return request<CreateOntologySubspaceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/subspace",
    method: "post",
    data: params,
  });
}
