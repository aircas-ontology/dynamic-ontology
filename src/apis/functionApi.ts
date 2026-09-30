import type {
  ApiResponse,
  CreateOntologyFunctionData,
  CreateOntologyFunctionParams,
  GetOntologyFunctionListData,
  GetOntologyFunctionListParams,
} from "@/types";
import { request } from "@/utils/request";

/**
 * @description 创建本体空间下的函数算子（本阶段为基础查询 BASIC_QUERY）。
 *
 * 请求方式：POST `/ontology/function`
 *
 * @param params 创建参数。
 * @param params.functionApi 函数 API 名称。
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
 * @description 分页查询函数算子列表。
 *
 * 请求方式：GET `/ontology/function/list`
 *
 * @param params 查询参数。
 * @param params.pageNum 可选页码，从 1 开始，默认 1。
 * @param params.pageSize 可选每页条数，默认 10。
 * @returns 标准 API 响应，包含函数列表分页数据。
 */
export function getOntologyFunctionListInterface(params?: GetOntologyFunctionListParams): Promise<ApiResponse<GetOntologyFunctionListData>> {
  return request<GetOntologyFunctionListData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/list",
    method: "get",
    params,
  });
}
