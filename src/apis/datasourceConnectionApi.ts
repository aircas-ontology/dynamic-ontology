import type {
  ApiResponse,
  BuildObjectFromDatasourceData,
  BuildObjectFromDatasourceParams,
  DatasourceConnectionItem,
  DatasourceConnectionPage,
  DatasourceConnectionParam,
  DatasourceSchema,
  DatasourceTableDetail,
  DatasourceTableSummary,
  ListDatasourceConnectionsParams,
  ListDatasourceSchemasParams,
  ListDatasourceTableColumnsByDatasourceParams,
  ListDatasourceTableColumnsParams,
  ListDatasourceTablesByDatasourceParams,
  ListDatasourceTablesParams,
  UploadSqliteDatabaseData,
  UploadSqliteDatabaseParams,
} from "@/types";
import { request } from "@/utils/request";

/**
 * @description DELETE /ontology/datasource/connection 物理删除历史数据源连接。
 * @param id 待删除的数据源连接 ID。
 * @returns 删除操作的标准响应。
 */
export function deleteDatasourceConnectionInterface(id: number): Promise<ApiResponse<void>> {
  return request<void>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection", method: "delete", params: { id } });
}

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

/**
 * @description 上传 SQLite 数据库文件，返回可提交的 JDBC URL。
 *
 * 请求方式：POST `/ontology/datasource/connection/sqlite/upload`
 *
 * @param params 上传参数。
 * @param params.file 必填 SQLite 数据库文件。
 * @returns 标准 API 响应，data 含 jdbcUrl、schemaName、path、fileName、size、tableCount。
 */
export function postUploadSqliteDatabaseInterface(params: UploadSqliteDatabaseParams): Promise<ApiResponse<UploadSqliteDatabaseData>> {
  const formData = new FormData();
  formData.append("file", params.file);
  return request<UploadSqliteDatabaseData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/sqlite/upload",
    method: "post",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * @description GET /ontology/datasource/connection/table/list_by_datasource 查询未绑定空间所选数据源的表摘要。
 * @param params 数据源连接 id 及外部数据库 schemaName。
 * @returns 表名、说明及字段数量列表。
 */
export function getDatasourceTableListByDatasourceInterface(params: ListDatasourceTablesByDatasourceParams): Promise<ApiResponse<DatasourceTableSummary[]>> {
  return request<DatasourceTableSummary[]>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/table/list_by_datasource",
    method: "get",
    params,
  });
}

/**
 * @description GET /ontology/datasource/connection/table/list 查询数据源所选 schema 中的表摘要。
 * @param params 数据源 ID（兼容空间 ID）和 schema 名称。
 * @returns 表名、说明及字段数量。
 */
export function getDatasourceTableListInterface(params: ListDatasourceTablesParams): Promise<ApiResponse<DatasourceTableSummary[]>> {
  return request<DatasourceTableSummary[]>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/table/list",
    method: "get",
    params,
  });
}

/**
 * @description GET /ontology/datasource/connection/table/columns_by_datasource 查询未绑定空间所选数据表的字段及外键候选。
 * @param params 数据源连接 id、schemaName 及所选 tableNames（请求时以逗号连接，保留大小写）。
 * @returns 数据表字段、主键及外键候选列表。
 */
export function getDatasourceTableColumnsByDatasourceInterface(
  params: ListDatasourceTableColumnsByDatasourceParams,
): Promise<ApiResponse<DatasourceTableDetail[]>> {
  return request<DatasourceTableDetail[]>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/table/columns_by_datasource",
    method: "get",
    params: { ...params, tableNames: params.tableNames.join(",") },
  });
}

/**
 * @description GET /ontology/datasource/connection/table/columns 查询多张数据表的字段和外键候选。
 * @param params 数据源 ID（兼容空间 ID）、schema 名称及所选表名。
 * @returns 数据表字段、主键及外键候选列表。
 */
export function getDatasourceTableColumnsInterface(params: ListDatasourceTableColumnsParams): Promise<ApiResponse<DatasourceTableDetail[]>> {
  return request<DatasourceTableDetail[]>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/table/columns",
    method: "get",
    params: { ...params, tableNames: params.tableNames.join(",") },
  });
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

/**
 * @description GET /ontology/datasource/connection/schema/list_by_datasource 查询未绑定空间所选数据源的 schema。
 * @param id 已保存的数据源连接 ID。
 * @returns schema 名称及 catalog 列表。
 */
export function getDatasourceSchemaListByDatasourceInterface(id: number): Promise<ApiResponse<DatasourceSchema[]>> {
  return request<DatasourceSchema[]>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/schema/list_by_datasource",
    method: "get",
    params: { id },
  });
}

/**
 * @description GET /ontology/datasource/connection/schema/list 查询数据源的 schema。
 * @param params 当前空间 ID，可同时指定所选数据源 ID；仅传空间 ID 时查询空间绑定的数据源。
 * @returns schema 名称及 catalog 列表。
 */
export function getDatasourceSchemaListInterface(params: ListDatasourceSchemasParams): Promise<ApiResponse<DatasourceSchema[]>> {
  return request<DatasourceSchema[]>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/connection/schema/list", method: "get", params });
}
