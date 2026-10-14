import type {
  ApiResponse,
  CreateOntologyFunctionData,
  CreateOntologyFunctionParams,
  DeleteOntologyFunctionData,
  DeleteOntologyFunctionParams,
  FunctionPublishData,
  FunctionPublishParams,
  FunctionUnpublishData,
  FunctionUnpublishParams,
  GetOntologyFunctionDetailData,
  GetOntologyFunctionDetailParams,
  GetOntologyFunctionListData,
  GetOntologyFunctionListParams,
  GetOntologyFunctionVersionsData,
  GetOntologyFunctionVersionsParams,
  TestOntologyFunctionData,
  TestOntologyFunctionParams,
  UpdateOntologyFunctionData,
  UpdateOntologyFunctionParams,
} from "@/types";
import { request } from "@/utils/request";

/**
 * @description 创建本体空间下的函数算子（本阶段为基础查询 BASIC_QUERY）。
 *
 * 请求方式：POST `/ontology/function`
 *
 * @param params 创建参数。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号，格式 x.y.z。
 * @param params.displayName 函数显示名称。
 * @param params.description 函数说明。
 * @param params.type 函数模型，当前固定为 BASIC_QUERY。
 * @param params.ontologySpaceId 所属本体空间 id。
 * @param params.queryConfig 可选的基础查询配置（filters / aggFunc）。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function createOntologyFunctionInterface(params: CreateOntologyFunctionParams): Promise<ApiResponse<CreateOntologyFunctionData>> {
  return request<CreateOntologyFunctionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function",
    method: "post",
    data: params,
  });
}

/**
 * @description 修改本体空间下的函数算子（BASIC_QUERY / CUSTOMIZE）。
 *
 * 请求方式：PUT `/ontology/function`
 *
 * @param params 修改参数。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号，格式 x.y.z。
 * @param params.displayName 函数显示名称。
 * @param params.description 函数说明。
 * @param params.type 函数模型（BASIC_QUERY 或 CUSTOMIZE）。
 * @param params.ontologySpaceId 所属本体空间 id。
 * @param params.language 可选脚本语言（仅 CUSTOMIZE）。
 * @param params.code 可选脚本源码（仅 CUSTOMIZE）。
 * @param params.parameters 可选脚本参数列表（仅 CUSTOMIZE）。
 * @param params.queryConfig 可选的基础查询配置（filters / aggFunc）。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function updateOntologyFunctionInterface(params: UpdateOntologyFunctionParams): Promise<ApiResponse<UpdateOntologyFunctionData>> {
  return request<UpdateOntologyFunctionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function",
    method: "put",
    data: params,
  });
}

/**
 * @description 分页查询函数算子列表。
 *
 * 请求方式：GET `/ontology/function/list`
 *
 * @param params 查询参数。
 * @param params.ontologySpaceId 本体空间 id（必填）。
 * @param params.pageNum 可选页码，从 1 开始，默认 1。
 * @param params.pageSize 可选每页条数，默认 10。
 * @param params.displayName 可选函数名称（模糊搜索）。
 * @param params.type 可选函数类型（CUSTOMIZE / EXTERNAL / BASIC_QUERY / COMPOSITE）。
 * @param params.publishStatus 可选发布状态（0 未发布，1 已发布）。
 * @param params.startDate 可选创建开始日期（yyyy-MM-dd）。
 * @param params.endDate 可选创建结束日期（yyyy-MM-dd）。
 * @returns 标准 API 响应，包含函数列表分页数据。
 */
export function getOntologyFunctionListInterface(params: GetOntologyFunctionListParams): Promise<ApiResponse<GetOntologyFunctionListData>> {
  return request<GetOntologyFunctionListData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/list",
    method: "get",
    params,
  });
}

/**
 * @description 根据函数 API 名称查询函数详情。
 *
 * 请求方式：GET `/ontology/function/detail`
 *
 * @param params 查询参数。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号。
 * @returns 标准 API 响应，data 为函数详情。
 */
export function getOntologyFunctionDetailInterface(params: GetOntologyFunctionDetailParams): Promise<ApiResponse<GetOntologyFunctionDetailData>> {
  return request<GetOntologyFunctionDetailData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/detail",
    method: "get",
    params,
  });
}

/**
 * @description 根据函数 API 名称查询版本号列表。
 *
 * 请求方式：GET `/ontology/function/versions`（`functionApi` 以 query string 传递）。
 *
 * @param params 查询参数。
 * @param params.functionApi 函数 API 名称。
 * @returns 标准 API 响应，data 为版本号字符串数组。
 */
export function getOntologyFunctionVersionsInterface(params: GetOntologyFunctionVersionsParams): Promise<ApiResponse<GetOntologyFunctionVersionsData>> {
  return request<GetOntologyFunctionVersionsData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/versions",
    method: "get",
    params,
  });
}

/**
 * @description 按函数 API 名称删除函数算子。
 *
 * 请求方式：DELETE `/ontology/function/delete/{functionApi}`
 *
 * @param params 删除参数。
 * @param params.functionApi 函数 API 名称（路径参数）。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function deleteOntologyFunctionInterface(params: DeleteOntologyFunctionParams): Promise<ApiResponse<DeleteOntologyFunctionData>> {
  return request<DeleteOntologyFunctionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + `/ontology/function/delete/${encodeURIComponent(params.functionApi)}`,
    method: "delete",
  });
}

/**
 * @description 测试算子函数。
 *
 * 请求方式：POST `/ontology/function/test`
 *
 * @param params 测试参数。
 * @param params.functionApi 函数 API 名称。
 * @param params.ontologyIdentifier 本体唯一标识。
 * @param params.variableBindings 查询参数绑定对象。
 * @param params.pageNum 可选页码，默认 1。
 * @param params.pageSize 可选每页条数，默认 10。
 * @returns 标准 API 响应；成功时 data 暂为 null。
 */
export function testOntologyFunctionInterface(params: TestOntologyFunctionParams): Promise<ApiResponse<TestOntologyFunctionData>> {
  return request<TestOntologyFunctionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/test",
    method: "post",
    data: params,
  });
}

/**
 * @description 发布函数算子。
 *
 * 请求方式：POST `/ontology/function/publish`（`functionApi`、`version` 以 query string 传递）。
 *
 * @param params 发布参数（query）。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号，格式 x.y.z。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function postOntologyFunctionPublishInterface(params: FunctionPublishParams): Promise<ApiResponse<FunctionPublishData>> {
  return request<FunctionPublishData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/publish",
    method: "post",
    params,
  });
}

/**
 * @description 下线已发布的函数算子。
 *
 * 请求方式：POST `/ontology/function/unpublish`（`functionApi`、`version` 以 query string 传递）。
 *
 * @param params 下线参数（query）。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号，格式 x.y.z。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function postOntologyFunctionUnpublishInterface(params: FunctionUnpublishParams): Promise<ApiResponse<FunctionUnpublishData>> {
  return request<FunctionUnpublishData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/unpublish",
    method: "post",
    params,
  });
}
