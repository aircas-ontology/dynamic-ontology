import type { ApiResponse, OntologyGlobalSearchData, OntologyGlobalSearchParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 跨本体索引全局检索，按相关性返回名称、类型、描述及业务 id。
 *
 * 请求方式：POST `/ontology/search/global`
 *
 * @param params 检索参数。
 * @param params.keyword 查询内容（必填）。
 * @param params.sizs 返回条数上限（可选，字段名与契约一致）。
 * @returns 标准 API 响应，data 为检索结果数组。
 */
export function postOntologyGlobalSearchInterface(params: OntologyGlobalSearchParams): Promise<ApiResponse<OntologyGlobalSearchData>> {
  return request<OntologyGlobalSearchData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/search/global",
    method: "post",
    data: params,
  });
}
