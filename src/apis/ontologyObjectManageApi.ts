import type { AxiosResponse } from "axios";

import type {
  ApiResponse,
  CreateOntologyObjectData,
  CreateOntologyObjectParams,
  DeleteOntologyObjectData,
  DeleteOntologyObjectParams,
  ExportOntologyFile,
  ExportOntologyParams,
  ImportOntologiesData,
  ImportOntologiesParams,
  GetOntologyMetaStatisticData,
  GetOntologyMetaStatisticParams,
  GetOntologyObjectByCategoryIdData,
  GetOntologyObjectByCategoryIdParams,
  UpdateOntologyObjectData,
  UpdateOntologyObjectParams,
} from "@/types";
import { request, requestFull, RequestError } from "@/utils/request";

/**
 * @description 根据本体对象唯一标识删除本体对象。
 *
 * 请求方式：DELETE `/ontology/meta/{ontologyIdentifier}`
 *
 * @param params 删除本体对象参数。
 * @param params.ontologyIdentifier 本体对象唯一标识。
 * @returns 标准 API 响应，data 未定义具体业务字段。
 */
export function deleteOntologyObjectInterface(params: DeleteOntologyObjectParams): Promise<ApiResponse<DeleteOntologyObjectData>> {
  return request<DeleteOntologyObjectData>({
    url: `${DOMAIN_CONFIG.ONTOLOGYMANAGE_URL}/ontology/meta/${encodeURIComponent(params.ontologyIdentifier)}`,
    method: "delete",
  });
}

/**
 * @description 统计本体对象关联的实例、属性、关系和行为数量。
 *
 * 请求方式：GET `/ontology/meta/statistic`
 *
 * @param params 查询参数。
 * @param params.uniqueIdentifier 本体唯一标识，必填。
 * @returns 标准 API 响应，data 为本体对象资源统计对象。
 */
export function getOntologyMetaStatisticInterface(params: GetOntologyMetaStatisticParams): Promise<ApiResponse<GetOntologyMetaStatisticData>> {
  return request<GetOntologyMetaStatisticData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta/statistic",
    method: "get",
    params,
  });
}

/**
 * @description 读取导出响应头中的字符串值。
 * @param headers axios 响应头。
 * @param name 响应头名称。
 * @returns 字符串头值；缺失或不是字符串时返回空字符串。
 */
function readOntologyExportResponseHeader(headers: AxiosResponse["headers"], name: string): string {
  const raw = headers[name];
  return typeof raw === "string" ? raw : "";
}

/**
 * @description 按 exportType 导出单个本体。SCHEMA 表示仅结构，INSTANCE 表示含实例数据。
 *
 * 请求方式：GET `/ontology/meta/export`
 *
 * 在线文档未声明 JSON 响应体，成功结果按文件字节返回。
 * @param params 查询参数。
 * @param params.uniqueIdentifier 本体唯一标识，必填。
 * @param {string} params.exportType 导出类型，必填。SCHEMA 表示仅结构，INSTANCE 表示含实例数据。
 * @returns 文件内容和用于命名的响应头。
 */
export async function getExportOntologyInterface(params: ExportOntologyParams): Promise<ExportOntologyFile> {
  const response = await requestFull<Blob>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta/export",
    method: "get",
    params,
    responseType: "blob",
  });
  if (!(response.data instanceof Blob)) {
    throw new RequestError("导出失败，请重试。");
  }
  return {
    blob: response.data,
    contentDisposition: readOntologyExportResponseHeader(response.headers, "content-disposition"),
    contentType: readOntologyExportResponseHeader(response.headers, "content-type"),
  };
}

/**
 * @description 根据分类查询本体对象列表；不传分类 id 时查询全部本体对象。
 *
 * 请求方式：GET `/meta/category`
 *
 * @param params 可选的分类查询参数。
 * @param params.categoryId 分类 id，不传时查询全部本体对象。
 * @returns 标准 API 响应，data 为本体元数据列表。
 */
export function getOntologyObjectByCategoryIdInterface(params?: GetOntologyObjectByCategoryIdParams): Promise<ApiResponse<GetOntologyObjectByCategoryIdData>> {
  return request<GetOntologyObjectByCategoryIdData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta/category",
    method: "get",
    params,
  });
}

/**
 * @description 修改本体对象元数据。
 *
 * 请求方式：PUT `/ontology/meta`
 *
 * @param params 修改本体对象参数。
 * @param params.ontologyIdentifier 本体 id。
 * @param params.displayName 本体名称。
 * @param params.groupIds 本体分组 id 列表。
 * @param params.icon 本体图标。
 * @param params.description 本体描述。
 * @param params.categoryId 本体分类 id。
 * @returns 标准 API 响应。
 */
export function updateOntologyObjectInterface(params: UpdateOntologyObjectParams): Promise<ApiResponse<UpdateOntologyObjectData>> {
  return request<UpdateOntologyObjectData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta",
    method: "put",
    data: params,
  });
}

/**
 * @description 通过导入文件批量创建本体对象。
 *
 * 请求方式：POST `/ontology/meta/import`
 *
 * @param params 请求参数。
 * @param params.file 导入文件，必填。
 * @returns 标准 API 响应，data 未声明具体业务字段。
 */
export function postImportOntologiesInterface(params: ImportOntologiesParams): Promise<ApiResponse<ImportOntologiesData>> {
  const formData = new FormData();
  formData.append("file", params.file);
  return request<ImportOntologiesData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta/import",
    method: "post",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * @description 创建本体对象。
 *
 * 请求方式：POST `/ontology/meta`
 *
 * @param params 创建本体对象参数。
 * @param params.spaceId 当前本体空间 id。
 * @param params.displayName 本体对象显示名称。
 * @param params.apiName 本体对象 API 名称。
 * @param params.iconUrl 本体对象图标地址。
 * @param params.description 本体对象描述。
 * @param params.parentOntologyUniqueIdentifier 继承的本体对象唯一标识。
 * @param params.categoryId 本体对象所属分类 id。
 * @param params.groupIds 本体对象分组 id 列表。
 * @returns 标准 API 响应，data 为新创建的本体对象标识。
 */
export function createOntologyObjectInterface(params: CreateOntologyObjectParams): Promise<ApiResponse<CreateOntologyObjectData>> {
  return request<CreateOntologyObjectData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta",
    method: "post",
    data: params,
  });
}
