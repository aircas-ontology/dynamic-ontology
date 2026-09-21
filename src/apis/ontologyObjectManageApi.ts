import type {
  ApiResponse,
  CreateOntologyObjectData,
  CreateOntologyObjectParams,
  DeleteOntologyObjectData,
  DeleteOntologyObjectParams,
  GetOntologyObjectByCategoryIdData,
  GetOntologyObjectByCategoryIdParams,
  UpdateOntologyObjectData,
  UpdateOntologyObjectParams,
} from "@/types";
import { request } from "@/utils/request";

/**
 * @description 根据本体对象唯一标识删除本体对象。
 *
 * 请求方式：DELETE `/ontology/meta/{ontologyIdentifier}`
 *
 * @param params 删除本体对象参数。
 * @param params.ontologyIdentifier 本体对象唯一标识。
 * @returns 标准 API 响应，data 未定义具体业务字段。
 */
export function deleteOntologyObjectInterface(params: DeleteOntologyObjectParams): Promise<ApiResponse<DeleteOntologyObjectData>> {
  return request<DeleteOntologyObjectData>({
    url: `${DOMAIN_CONFIG.ONTOLOGYMANAGE_URL}/ontology/meta/${encodeURIComponent(params.ontologyIdentifier)}`,
    method: "delete",
  });
}

/**
 * @description 根据分类查询本体对象列表；不传分类 id 时查询全部本体对象。
 *
 * 请求方式：GET `/meta/category`
 *
 * @param params 可选的分类查询参数。
 * @param params.categoryId 分类 id，不传时查询全部本体对象。
 * @returns 标准 API 响应，data 为本体元数据列表。
 */
export function getOntologyObjectByCategoryIdInterface(params?: GetOntologyObjectByCategoryIdParams): Promise<ApiResponse<GetOntologyObjectByCategoryIdData>> {
  return request<GetOntologyObjectByCategoryIdData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta/category",
    method: "get",
    params,
  });
}

/**
 * @description 修改本体对象元数据。
 *
 * 请求方式：PUT `/ontology/meta`
 *
 * @param params 修改本体对象参数。
 * @param params.ontologyIdentifier 本体 id。
 * @param params.displayName 本体名称。
 * @param params.groupIds 本体分组 id 列表。
 * @param params.icon 本体图标。
 * @param params.description 本体描述。
 * @param params.categoryId 本体分类 id。
 * @returns 标准 API 响应。
 */
export function updateOntologyObjectInterface(params: UpdateOntologyObjectParams): Promise<ApiResponse<UpdateOntologyObjectData>> {
  return request<UpdateOntologyObjectData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta",
    method: "put",
    data: params,
  });
}

/**
 * @description 创建本体对象。
 *
 * 请求方式：POST `/ontology/meta`
 *
 * @param params 创建本体对象参数。
 * @param params.spaceId 当前本体空间 id。
 * @param params.displayName 本体对象显示名称。
 * @param params.apiName 本体对象 API 名称。
 * @param params.iconUrl 本体对象图标地址。
 * @param params.description 本体对象描述。
 * @param params.parentOntologyUniqueIdentifier 继承的本体对象唯一标识。
 * @param params.categoryId 本体对象所属分类 id。
 * @param params.groupIds 本体对象分组 id 列表。
 * @returns 标准 API 响应，data 为新创建的本体对象标识。
 */
export function createOntologyObjectInterface(params: CreateOntologyObjectParams): Promise<ApiResponse<CreateOntologyObjectData>> {
  return request<CreateOntologyObjectData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta",
    method: "post",
    data: params,
  });
}
