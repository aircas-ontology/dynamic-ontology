import type { ApiResponse, GetOntologyInheritanceTreeParams, OntologyInheritanceTreeNode } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 查询对象空间内的对象继承层级树。
 * 请求方式：GET `/ontology/meta/inheritance_tree`。
 * @param params 查询参数，`spaceId` 为对象空间 id。
 * @returns 标准响应，data 为不包含空间根节点的对象继承节点列表。
 */
export function getOntologyInheritanceTreeInterface(params: GetOntologyInheritanceTreeParams): Promise<ApiResponse<OntologyInheritanceTreeNode[]>> {
  return request<OntologyInheritanceTreeNode[]>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta/inheritance_tree",
    method: "get",
    params,
  });
}
