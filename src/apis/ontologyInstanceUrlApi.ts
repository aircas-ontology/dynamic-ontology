import type { ApiResponse, GetOntologyInstanceUrlListData, GetOntologyInstanceUrlListParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 查询实例 URL 列表；spaceId 必填，objectId / instanceId 可选。
 * @param params 查询参数。
 * @returns 标准 API 响应，data 为实例 URL 列表。
 */
export function getOntologyInstanceUrlListInterface(params: GetOntologyInstanceUrlListParams): Promise<ApiResponse<GetOntologyInstanceUrlListData>> {
  return request<GetOntologyInstanceUrlListData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/instance/url/list",
    method: "get",
    params,
  });
}
