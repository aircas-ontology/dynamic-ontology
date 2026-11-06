import type {
  ApiResponse,
  GetOntologyEntitiesData,
  GetOntologyEntitiesParams,
  GetOntologyEntityRowDetailData,
  GetOntologyEntityRowDetailParams,
  PostOntologyEntityAllLinkData,
  PostOntologyEntityAllLinkParams,
} from "@/types";
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

/**
 * @description 查询实体属性详情（按行返回，带存储分组）。
 *
 * 请求方式：POST `/ontology/entity/row_detail`
 *
 * @param params 查询请求体。
 * @param params.ontologyUniqueIdentifier 对象唯一标识。
 * @param params.entityPrimaryKey 实体主键。
 * @param params.sort 动态属性行排序 ASC/DESC。
 * @returns 标准 API 响应；data 为分组属性详情或 null。
 */
export function postGetOntologyEntityRowDetailInterface(params: GetOntologyEntityRowDetailParams): Promise<ApiResponse<GetOntologyEntityRowDetailData>> {
  return request<GetOntologyEntityRowDetailData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/entity/row_detail",
    method: "post",
    data: params,
  });
}

/**
 * @description 查询两端实体之间的关联关系。
 *
 * 请求方式：POST `/ontology/entity/link_between`
 *
 * @param params From/To 对象标识与实体主键。
 * @returns 标准 API 响应；data 为两端实体关联关系列表。
 */
export function postOntologyEntityAllLinkInterface(params: PostOntologyEntityAllLinkParams): Promise<ApiResponse<PostOntologyEntityAllLinkData>> {
  return request<PostOntologyEntityAllLinkData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/entity/link_between",
    method: "post",
    data: params,
  });
}
