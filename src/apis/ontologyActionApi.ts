import type {
  ApiResponse,
  CreateOntologyActionData,
  CreateOntologyActionParams,
  EditOntologyActionData,
  EditOntologyActionParams,
  GetOntologyActionInfoData,
  GetOntologyActionInfoParams,
  ListOntologyActionData,
  ListOntologyActionParams,
} from "@/types";
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
 * @description 查询本体行为详情。
 *
 * 请求方式：GET `/ontology/action`
 *
 * @param params 查询参数，含 actionApi。
 * @returns 标准 API 响应，data 为行为详情。
 */
export function getOntologyActionInfoInterface(params: GetOntologyActionInfoParams): Promise<ApiResponse<GetOntologyActionInfoData>> {
  return request<GetOntologyActionInfoData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action",
    method: "get",
    params,
  });
}

/**
 * @description 编辑本体行为；body 与创建一致，靠 actionApi 定位。
 *
 * 请求方式：PUT `/ontology/action`
 *
 * @param params 编辑行为请求体。
 * @returns 标准 API 响应，成功时 data 为 null。
 */
export function putEditOntologyActionInterface(params: EditOntologyActionParams): Promise<ApiResponse<EditOntologyActionData>> {
  return request<EditOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action",
    method: "put",
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
