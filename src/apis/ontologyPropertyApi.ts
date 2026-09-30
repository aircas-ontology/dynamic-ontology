import type {
  AutoBindOntologyPropertyDatasourceData,
  AutoBindOntologyPropertyDatasourceParams,
  ApiResponse,
  BatchUpdateOntologyPropertiesData,
  BatchUpdateOntologyPropertiesParams,
  CreateOntologyPropertyData,
  CreateOntologyPropertyParams,
  DeleteOntologyPropertyData,
  DeleteOntologyPropertyParams,
  GetOntologyPropertyByCategoryIdData,
  GetOntologyPropertyByCategoryIdParams,
  GetOntologyPropertyByOntologyIdData,
  GetOntologyPropertyByOntologyIdParams,
  GetOntologyPropertyDetailByOntologyIdData,
  GetOntologyPropertyDetailByOntologyIdParams,
  UpdateOntologyPropertyData,
  UpdateOntologyPropertyParams,
} from "@/types";
import { request } from "@/utils/request";

/**
 * @description 根据本体标识自动关联本体属性数据源。
 * 请求方式：POST `/ontology/property/auto_bind_datasource`
 *
 * @param params 自动关联数据源请求参数。
 * @param params.ontologyIdentifier 本体标识，后端据此自动处理全部数据源匹配。
 * @returns 标准 API 响应，data 由服务端定义。
 */
export function autoBindOntologyPropertyDatasourceInterface(
  params: AutoBindOntologyPropertyDatasourceParams,
): Promise<ApiResponse<AutoBindOntologyPropertyDatasourceData>> {
  return request<AutoBindOntologyPropertyDatasourceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/auto_bind_datasource",
    method: "post",
    data: params,
  });
}

/**
 * @description 创建本体对象属性。
 * 请求方式：POST `/ontology/property`
 *
 * @param params 创建属性请求体。
 * @param params.ontologyIdentifier 本体唯一标识。
 * @param params.displayName 属性名称。
 * @param params.apiName 属性 API 名称。
 * @returns 标准 API 响应。
 */
export function createOntologyPropertyInterface(params: CreateOntologyPropertyParams): Promise<ApiResponse<CreateOntologyPropertyData>> {
  return request<CreateOntologyPropertyData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property",
    method: "post",
    data: params,
  });
}

/**
 * @description 删除本体对象属性。
 * 请求方式：DELETE `/ontology/property/{propertyUniqueIdentifier}`
 *
 * @param params 删除属性请求参数。
 * @returns 标准 API 响应。
 */
export function deleteOntologyPropertyInterface(params: DeleteOntologyPropertyParams): Promise<ApiResponse<DeleteOntologyPropertyData>> {
  return request<DeleteOntologyPropertyData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + `/ontology/property/${encodeURIComponent(params.propertyUniqueIdentifier)}`,
    method: "delete",
  });
}

/**
 * @description 根据分类查询本体对象属性列表，不传分类 id 时查询全部属性。
 * 请求方式：GET `/ontology/property/by_category`
 *
 * @param params 可选分类查询参数。
 * @param params.categoryId 属性分类 id。
 * @returns 标准 API 响应，data 为属性列表。
 */
export function getOntologyPropertyByCategoryIdInterface(
  params?: GetOntologyPropertyByCategoryIdParams,
): Promise<ApiResponse<GetOntologyPropertyByCategoryIdData>> {
  return request<GetOntologyPropertyByCategoryIdData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/by_category",
    method: "get",
    params,
  });
}

/**
 * @description 根据本体唯一标识查询包含数据源信息的属性详情列表。
 * 请求方式：GET `/ontology/property/detail`
 *
 * @param params 本体唯一标识查询参数。
 * @param params.ontologyUniqueIdentifier 本体唯一标识。
 * @returns 标准 API 响应，data 为包含数据源表和字段信息的属性详情列表。
 */
export function getOntologyPropertyDetailByOntologyIdInterface(
  params: GetOntologyPropertyDetailByOntologyIdParams,
): Promise<ApiResponse<GetOntologyPropertyDetailByOntologyIdData>> {
  return request<GetOntologyPropertyDetailByOntologyIdData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/detail",
    method: "get",
    params,
  });
}

/**
 * @description 根据本体唯一标识查询全部本体对象属性。
 * 请求方式：GET `/ontology/property/info`
 *
 * @param params 本体唯一标识查询参数。
 * @param params.ontologyUniqueIdentifier 本体唯一标识。
 * @returns 标准 API 响应，data 为属性列表。
 */
export function getOntologyPropertyByOntologyIdInterface(
  params: GetOntologyPropertyByOntologyIdParams,
): Promise<ApiResponse<GetOntologyPropertyByOntologyIdData>> {
  return request<GetOntologyPropertyByOntologyIdData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/info",
    method: "get",
    params,
  });
}

/**
 * @description 批量更新本体属性及其数据源关联信息。
 * 请求方式：PUT `/ontology/property/batch`
 *
 * @param params 待更新的属性数组。
 * @param params[].uniqueIdentifier 属性唯一标识。
 * @param params[].datasource 可选的数据源关联信息。
 * @returns 标准 API 响应，data 由服务端定义。
 */
export function putBatchUpdateOntologyPropertiesInterface(
  params: BatchUpdateOntologyPropertiesParams,
): Promise<ApiResponse<BatchUpdateOntologyPropertiesData>> {
  return request<BatchUpdateOntologyPropertiesData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/batch",
    method: "put",
    data: params,
  });
}

/**
 * @description 修改本体对象属性。
 * 请求方式：PUT `/ontology/property`
 *
 * @param params 修改属性请求体。
 * @param params.uniqueIdentifier 属性唯一标识。
 * @param params.displayName 属性名称。
 * @param params.apiName 属性 API 名称。
 * @param params.dataType 数据类型。
 * @returns 标准 API 响应。
 */
export function updateOntologyPropertyInterface(params: UpdateOntologyPropertyParams): Promise<ApiResponse<UpdateOntologyPropertyData>> {
  return request<UpdateOntologyPropertyData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property",
    method: "put",
    data: params,
  });
}
