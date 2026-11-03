import type { ApiResponse, CreateOntologyActionData, CreateOntologyActionParams, ListOntologyActionData, ListOntologyActionParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 创建本体行为。
 *
 * 请求方式：POST `/ontology/action`
 *
 * @param params 创建行为请求体。
 * @returns 标准 API 响应，成功时 data 为 null。
 */
export function postCreateOntologyActionInterface(params: CreateOntologyActionParams): Promise<ApiResponse<CreateOntologyActionData>> {
  return request<CreateOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action",
    method: "post",
    data: params,
  });
}

/**
 * @description 分页查询本体行为列表。
 *
 * 请求方式：GET `/ontology/action/list`
 *
 * @param params 查询参数。
 * @returns 标准 API 响应，data 为分页行为列表。
 */
export function getListOntologyActionInterface(params: ListOntologyActionParams): Promise<ApiResponse<ListOntologyActionData>> {
  return request<ListOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/list",
    method: "get",
    params,
  });
}
