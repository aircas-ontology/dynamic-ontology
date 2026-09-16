import type { ApiResponse, OntologyListData } from "@/types";
import { request } from "@/utils/request";

export function getOntologyListInterface(): Promise<ApiResponse<OntologyListData>> {
  return request<OntologyListData>({
    url: DOMAIN_CONFIG.LOGIN_URL + "/ontology/space",
    method: "get",
  });
}
