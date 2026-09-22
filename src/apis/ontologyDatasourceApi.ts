import type {
  ApiResponse,
  GetOntologyDatasourceColumnsData,
  GetOntologyDatasourceColumnsParams,
  GetOntologyDatasourceTablesData,
  GetOntologyDatasourceTablesParams,
} from "@/types";
import { requestTimeoutMs } from "@/utils/constants";
import { request } from "@/utils/request";

/**
 * @description 查询本体空间下的数据源表列表。
 * 请求方式：GET `/ontology/datasource/table`
 * @param params 数据源表分页查询参数。
 * @returns 标准 API 响应，data 为数据源表分页结果。
 */
export function getOntologyDatasourceTablesInterface(params: GetOntologyDatasourceTablesParams): Promise<ApiResponse<GetOntologyDatasourceTablesData>> {
  return request<GetOntologyDatasourceTablesData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/table",
    method: "get",
    params,
    timeout: requestTimeoutMs,
  });
}

/**
 * @description 查询本体空间下指定数据源表的字段列表。
 * 请求方式：GET `/ontology/datasource/column`
 * @param params 数据源字段查询参数。
 * @returns 标准 API 响应，data 为字段描述数组。
 */
export function getOntologyDatasourceColumnsInterface(params: GetOntologyDatasourceColumnsParams): Promise<ApiResponse<GetOntologyDatasourceColumnsData>> {
  return request<GetOntologyDatasourceColumnsData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/column",
    method: "get",
    params,
    timeout: requestTimeoutMs,
  });
}
