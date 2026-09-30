import type { OntologyApiDocsData } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 查询本体服务 OpenAPI 接口文档（SpringDoc 原始文档体，非 ApiResponse 包裹）。
 *
 * 请求方式：GET `/ontology/v3/api-docs/ontology`
 *
 * @returns OpenAPI 3.x 文档对象，含 info、servers、tags、paths、components。
 */
export function getOntologyApiDocsInterface(): Promise<OntologyApiDocsData> {
  return request({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/v3/api-docs/ontology",
    method: "get",
  }) as unknown as Promise<OntologyApiDocsData>;
}
