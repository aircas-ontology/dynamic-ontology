import type {
  ApiResponse,
  BuildObjectFromDatasourceData,
  BuildObjectFromDatasourceParams,
  DatasourceConnectionItem,
  DatasourceConnectionPage,
  DatasourceConnectionParam,
  DatasourceTableDetail,
  DatasourceTableSummary,
  ListDatasourceConnectionsParams,
  ListDatasourceTableColumnsParams,
} from "@/types";
import { request } from "@/utils/request";

/** @description 分页查询数据源连接列表。 */
export function getDatasourceConnectionListInterface(params?: ListDatasourceConnectionsParams): Promise<ApiResponse<DatasourceConnectionPage>> {
  return request<DatasourceConnectionPage>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/list", method: "get", params });
}

/** @description 查询单个数据源连接配置。 */
export function getDatasourceConnectionDetailInterface(id: number): Promise<ApiResponse<DatasourceConnectionItem>> {
  return request<DatasourceConnectionItem>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/detail", method: "get", params: { id } });
}

/** @description 创建数据源连接配置。 */
export function postDatasourceConnectionInterface(data: DatasourceConnectionParam): Promise<ApiResponse<DatasourceConnectionItem>> {
  return request<DatasourceConnectionItem>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection", method: "post", data });
}

/** @description 测试数据源连接。 */
export function postDatasourceConnectionTestInterface(data: DatasourceConnectionParam, id?: number): Promise<ApiResponse<string>> {
  return request<string>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/test",
    method: "post",
    params: id === undefined ? undefined : { id },
    data,
  });
}

/** @description 查询数据源中的表摘要。 */
export function getDatasourceTableListInterface(datasourceId: number): Promise<ApiResponse<DatasourceTableSummary[]>> {
  return request<DatasourceTableSummary[]>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/table/list",
    method: "get",
    params: { datasourceId },
  });
}

/** @description 查询多张数据表的字段和外键候选。 */
export function getDatasourceTableColumnsInterface(params: ListDatasourceTableColumnsParams): Promise<ApiResponse<DatasourceTableDetail[]>> {
  return request<DatasourceTableDetail[]>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/table/columns", method: "get", params });
}

/**
 * @description 使用外部数据源选择的表、字段和外键创建本体对象。
 * @param data 数据源构建对象请求参数。
 * @returns 标准 API 响应，包含新建对象标识、表数量和映射数量。
 */
export function postBuildObjectFromDatasourceInterface(data: BuildObjectFromDatasourceParams): Promise<ApiResponse<BuildObjectFromDatasourceData>> {
  return request<BuildObjectFromDatasourceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/build_object",
    method: "post",
    data,
  });
}
