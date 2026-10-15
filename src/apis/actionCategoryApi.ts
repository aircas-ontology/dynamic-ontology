import type {
  ActionCategoryVO,
  ApiResponse,
  CreateActionCategoryParams,
  DeleteActionCategoryParams,
  GetActionCategoryTreeParams,
  UpdateActionCategoryParams,
} from "@/types";
import { request } from "@/utils/request";

/**
 * @description 查询本体空间的行为分类体系树。
 * @param params 查询参数。
 * @param params.spaceId 本体空间 id。
 * @returns 标准 API 响应，data 为行为分类体系树。
 */
export function getActionCategoryTreeInterface(params: GetActionCategoryTreeParams): Promise<ApiResponse<ActionCategoryVO | ActionCategoryVO[]>> {
  return request<ActionCategoryVO | ActionCategoryVO[]>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action_category/tree",
    method: "get",
    params,
  });
}

/**
 * @description 创建本体空间下的行为分类体系树节点。
 * @param params 行为分类创建参数。
 * @returns 标准 API 响应。
 */
export function createActionCategoryInterface(params: CreateActionCategoryParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action_category",
    method: "post",
    data: params,
  });
}

/**
 * @description 修改行为分类名称。
 * @param params 行为分类修改参数。
 * @returns 标准 API 响应。
 */
export function updateActionCategoryInterface(params: UpdateActionCategoryParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action_category",
    method: "put",
    data: params,
  });
}

/**
 * @description 删除行为分类节点。
 * @param params 行为分类删除参数。
 * @returns 标准 API 响应。
 */
export function deleteActionCategoryInterface(params: DeleteActionCategoryParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action_category",
    method: "delete",
    data: params,
  });
}
