import type { ApiResponse, BehaviorTreeSavePayload, GetActionTreeNodeDefsData, GetActionTreeNodeDefsParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 查询行为树节点目录与可绑定行为。
 *
 * 请求方式：GET `/ontology/action/tree/node-defs`
 *
 * @param params 查询参数。
 * @returns 标准 API 响应。
 */
export function getActionTreeNodeDefsInterface(params: GetActionTreeNodeDefsParams): Promise<ApiResponse<GetActionTreeNodeDefsData>> {
  return request<GetActionTreeNodeDefsData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/tree/node-defs",
    method: "get",
    params,
  });
}

/**
 * @description 创建行为树（TREE）。
 *
 * 请求方式：POST `/ontology/action`
 *
 * @param params TREE 保存请求体。
 * @returns 标准 API 响应，成功时 data 为 null。
 */
export function postCreateBehaviorTreeActionInterface(params: BehaviorTreeSavePayload): Promise<ApiResponse<null>> {
  return request<null>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action",
    method: "post",
    data: params,
  });
}

/**
 * @description 更新行为树（TREE）；body 与创建一致，靠 actionApi 定位。
 *
 * 请求方式：PUT `/ontology/action`
 *
 * @param params TREE 保存请求体。
 * @returns 标准 API 响应，成功时 data 为 null。
 */
export function putUpdateBehaviorTreeActionInterface(params: BehaviorTreeSavePayload): Promise<ApiResponse<null>> {
  return request<null>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action",
    method: "put",
    data: params,
  });
}
