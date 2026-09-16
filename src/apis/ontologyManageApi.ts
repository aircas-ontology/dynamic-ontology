import type { ApiResponse, OntologySpaceListData } from "@/types";
import { request } from "@/utils/request";

/** 列表查询超时时间（毫秒）：远程不可达时快速失败，使页面回退到样例数据。 */
const ONTOLOGY_SPACE_LIST_TIMEOUT = 10000;

/**
 * @description 查询本体空间列表。
 *
 * 请求方式：GET `/ontology/space`
 *
 * 无入参；10 秒超时，超时或失败由调用方回退样例数据。
 * @returns 标准 API 响应，data 为本体空间数组。
 */
export function getOntologySpaceListInterface(): Promise<ApiResponse<OntologySpaceListData>> {
  return request<OntologySpaceListData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    method: "get",
    timeout: ONTOLOGY_SPACE_LIST_TIMEOUT,
  });
}
