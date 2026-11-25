import type { ApiResponse, OntologyEntityQueryData, OntologyEntityQueryItem } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 批量查询多个对象的实例数据。
 *
 * 请求方式：POST `/ontology/entity/query`
 *
 * @param params 对象实例查询请求项；每项传入对象唯一标识和需要筛选的实例主键，空主键数组表示查询该对象下全部实例。
 * @returns 标准 API 响应，data 按对象唯一标识分组返回实例列表。
 */
export function postOntologyEntityQueryInterface(params: OntologyEntityQueryItem[]): Promise<ApiResponse<OntologyEntityQueryData>> {
  return request<OntologyEntityQueryData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/entity/query",
    method: "post",
    data: params,
  });
}
