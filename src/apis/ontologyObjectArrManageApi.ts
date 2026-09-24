import type {
  ApiResponse,
  CreateOntologyObjectArrTypeTreeParams,
  DeleteOntologyObjectArrTypeTreeParams,
  GetOntologyMetaByObjectIdData,
  GetOntologyMetaByObjectIdParams,
  GetOntologyObjectArrTypeTreeData,
  GetOntologyObjectArrTypeTreeParams,
  UpdateOntologyObjectArrTypeTreeParams,
} from "@/types";
import { request } from "@/utils/request";

/**
 * 创建本体对象属性分类。
 *
 * 请求方式：POST `/ontology/property/category`
 *
 * @param params 创建参数，包含本体对象标识、固定父节点和分类名称。
 * @param params.ontologyIdentifier 本体对象标识。
 * @param params.parentId 分类父节点标识，根分类使用 0。
 * @param params.name 分类名称。
 * @returns 标准 API 响应，成功时不携带业务数据。
 */
export function createOntologyObjectArrTypeTreeInterface(params: CreateOntologyObjectArrTypeTreeParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/category",
    method: "post",
    data: params,
  });
}

/**
 * 编辑本体对象属性分类。
 *
 * 请求方式：PUT `/ontology/property/category`
 *
 * @param params 编辑参数，包含本体对象标识、分类标识和新名称。
 * @param params.ontologyIdentifier 本体对象标识。
 * @param params.categoryId 分类标识。
 * @param params.name 分类名称。
 * @returns 标准 API 响应，成功时不携带业务数据。
 */
export function updateOntologyObjectArrTypeTreeInterface(params: UpdateOntologyObjectArrTypeTreeParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/category",
    method: "put",
    data: params,
  });
}

/**
 * 删除本体对象属性分类。
 *
 * 请求方式：DELETE `/ontology/property/category`
 *
 * @param params 删除参数，包含本体对象标识和分类标识。
 * @param params.ontologyIdentifier 本体对象标识。
 * @param params.categoryId 分类标识。
 * @returns 标准 API 响应，成功时不携带业务数据。
 */
export function deleteOntologyObjectArrTypeTreeInterface(params: DeleteOntologyObjectArrTypeTreeParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/category",
    method: "delete",
    data: params,
  });
}

/**
 * @description 查询本体对象属性分类树。
 *
 * 请求方式：GET `/ontology/property/category`
 *
 * @param params 查询本体对象属性分类参数。
 * @param params.ontologyUniqueIdentifier 本体对象唯一标识。
 * @returns 标准 API 响应，data 为属性分类树。
 */
export function getOntologyObjectArrTypeTreeInterface(params: GetOntologyObjectArrTypeTreeParams): Promise<ApiResponse<GetOntologyObjectArrTypeTreeData>> {
  return request<GetOntologyObjectArrTypeTreeData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/category",
    method: "get",
    params,
  });
}

/**
 * @description 根据本体对象 id 查询对象简要信息（id、对象名称、空间名称、uniqueIdentifier）。
 *
 * 请求方式：GET `/ontology/meta/{objectid}`
 *
 * @param params 查询参数。
 * @param params.objectId 本体对象 id。
 * @returns 标准 API 响应，data 为对象简要信息。
 */
export function getOntologyMetaByObjectIdInterface(params: GetOntologyMetaByObjectIdParams): Promise<ApiResponse<GetOntologyMetaByObjectIdData>> {
  return request<GetOntologyMetaByObjectIdData>({
    url: `${DOMAIN_CONFIG.ONTOLOGYMANAGE_URL}/ontology/meta/${encodeURIComponent(String(params.objectId))}`,
    method: "get",
  });
}
