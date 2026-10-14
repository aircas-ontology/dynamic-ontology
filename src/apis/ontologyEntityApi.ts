import type { ApiResponse, GetOntologyEntitiesData, GetOntologyEntitiesParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 分页查询指定对象下的实体实例主属性信息。
 * @param params 查询参数，包含对象唯一标识、页码和每页条数。
 * @returns 标准 API 响应，data 为实体实例分页数据。
 */
export function getOntologyEntitiesInterface(params: GetOntologyEntitiesParams): Promise<ApiResponse<GetOntologyEntitiesData>> {
  return request<GetOntologyEntitiesData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/entity/list",
    method: "get",
    params,
  });
}
