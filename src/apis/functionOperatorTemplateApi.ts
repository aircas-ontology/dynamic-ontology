import type {
  ApiResponse,
  CreateFunctionOperatorTemplateData,
  CreateFunctionOperatorTemplateParams,
  DeleteFunctionOperatorTemplateParams,
  ListFunctionOperatorTemplateData,
  ListFunctionOperatorTemplateParams,
  UpdateFunctionOperatorTemplateData,
  UpdateFunctionOperatorTemplateParams,
} from "@/types";
import { request } from "@/utils/request";

/**
 * @description 查询函数算子代码模板列表。
 * @param params 可选的名称模糊匹配和脚本语言筛选条件。
 * @returns 函数算子代码模板列表。
 */
export function getListFunctionOperatorTemplateInterface(params?: ListFunctionOperatorTemplateParams): Promise<ApiResponse<ListFunctionOperatorTemplateData>> {
  return request<ListFunctionOperatorTemplateData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/operator_template/list",
    method: "get",
    params,
  });
}

/**
 * @description 创建函数算子代码模板。
 * @param params 模板名称、语言、说明和代码。
 * @returns 创建后的函数算子代码模板。
 */
export function postCreateFunctionOperatorTemplateInterface(
  params: CreateFunctionOperatorTemplateParams,
): Promise<ApiResponse<CreateFunctionOperatorTemplateData>> {
  return request<CreateFunctionOperatorTemplateData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/operator_template",
    method: "post",
    data: params,
  });
}

/**
 * @description 修改函数算子代码模板。
 * @param params 模板 ID 及修改后的模板字段。
 * @returns 修改后的函数算子代码模板。
 */
export function putUpdateFunctionOperatorTemplateInterface(
  params: UpdateFunctionOperatorTemplateParams,
): Promise<ApiResponse<UpdateFunctionOperatorTemplateData>> {
  return request<UpdateFunctionOperatorTemplateData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/operator_template",
    method: "put",
    params: { id: params.id },
    data: params.data,
  });
}

/**
 * @description 删除函数算子代码模板。
 * @param params 待删除模板 ID。
 * @returns 删除结果响应。
 */
export function deleteFunctionOperatorTemplateInterface(params: DeleteFunctionOperatorTemplateParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/operator_template",
    method: "delete",
    params,
  });
}
