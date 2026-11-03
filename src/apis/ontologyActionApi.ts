import type { ApiResponse, CreateOntologyActionData, CreateOntologyActionParams } from "@/types";
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
