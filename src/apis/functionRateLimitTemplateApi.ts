import type {
  ApiResponse,
  DisableFunctionRateLimitTemplateParams,
  EnableFunctionRateLimitTemplateParams,
  DeleteFunctionRateLimitTemplateParams,
  CreateFunctionRateLimitTemplateData,
  CreateFunctionRateLimitTemplateParams,
  ListFunctionRateLimitTemplateData,
  ListFunctionRateLimitTemplateParams,
  UpdateFunctionRateLimitTemplateParams,
  UpdateFunctionRateLimitTemplateData,
} from "@/types";
import { request } from "@/utils/request";

/**
 * @description 创建限流配置模板。
 * @param params 超时、重试、限流和启用状态配置。
 * @returns 服务端创建后的模板。
 */
export function postCreateFunctionRateLimitTemplateInterface(
  params: CreateFunctionRateLimitTemplateParams,
): Promise<ApiResponse<CreateFunctionRateLimitTemplateData>> {
  return request<CreateFunctionRateLimitTemplateData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/rate_limit_template",
    method: "post",
    data: params,
  });
}

/** @description 查询模板列表。GET /ontology/function/rate_limit_template/list。 @param params enabled 可选，不传查全部。 @returns 模板数组响应。 */
export function getListFunctionRateLimitTemplateInterface(
  params?: ListFunctionRateLimitTemplateParams,
): Promise<ApiResponse<ListFunctionRateLimitTemplateData>> {
  return request<ListFunctionRateLimitTemplateData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/rate_limit_template/list",
    method: "get",
    params,
  });
}
/** @description 更新模板。PUT /ontology/function/rate_limit_template。 @param params 包含模板ID的配置。 @returns 更新后的模板响应。 */
export function putUpdateFunctionRateLimitTemplateInterface(
  params: UpdateFunctionRateLimitTemplateParams,
): Promise<ApiResponse<UpdateFunctionRateLimitTemplateData>> {
  return request<UpdateFunctionRateLimitTemplateData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/rate_limit_template",
    method: "put",
    data: params,
  });
}

/**
 * @description 删除限流配置模板。DELETE `/ontology/function/rate_limit_template`，无请求体。
 * @param params 查询参数，id 为必填模板ID。
 * @returns RestResultVoid 响应，data 未定义具体结构。
 */
export function deleteFunctionRateLimitTemplateInterface(params: DeleteFunctionRateLimitTemplateParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/rate_limit_template", method: "delete", params });
}

/**
 * @description 启用限流配置模板。PUT `/ontology/function/rate_limit_template/enable`，无请求体。
 * @param params 查询参数，id 为必填模板ID。
 * @returns RestResultVoid 响应，data 未定义具体结构。
 */
export function putEnableFunctionRateLimitTemplateInterface(params: EnableFunctionRateLimitTemplateParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/rate_limit_template/enable", method: "put", params });
}

/**
 * @description 停用限流配置模板。PUT `/ontology/function/rate_limit_template/disable`，无请求体。
 * @param params 查询参数，id 为必填模板ID。
 * @returns RestResultVoid 响应，data 未定义具体结构。
 */
export function putDisableFunctionRateLimitTemplateInterface(params: DisableFunctionRateLimitTemplateParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/rate_limit_template/disable", method: "put", params });
}
