import type { AxiosResponse } from "axios";

import type {
  ApiResponse,
  CreateOntologyCategoryTreeParams,
  CreateOntologyLinkParams,
  CreateOntologyRelationCategoryTreeParams,
  DeleteOntologyCategoryTreeParams,
  DeleteOntologyLinkParams,
  DeleteOntologyRelationCategoryTreeParams,
  OntologyCategoryTreeData,
  OntologyCategoryTreeParams,
  OntologyRelationCategoryTreeData,
  OntologyRelationCategoryTreeParams,
  OntologySpaceListData,
  GetOntologyOverviewCountData,
  GetOntologySpaceStatisticData,
  GetOntologySpaceStatisticParams,
  ImportOntologySpaceData,
  ImportOntologySpaceParams,
  UpdateOntologyCategoryNameParams,
  UpdateOntologyLinkParams,
  UpdateOntologyRelationCategoryNameParams,
  CreateOntologySpaceData,
  CreateOntologySpaceParams,
  CreateOntologySpaceWithCanvasContentData,
  CreateOntologySpaceWithCanvasContentParams,
  DeleteOntologySpaceData,
  DeleteOntologySpaceParams,
  ExportOntologySpaceFile,
  ExportOntologySpaceParams,
  UpdateOntologySpaceData,
  UpdateOntologySpaceParams,
  UploadOntologyThumbnailData,
  UploadOntologyThumbnailParams,
} from "@/types";
import { request, requestFull, RequestError } from "@/utils/request";

/**
 * @description 创建本体空间。
 *
 * 请求方式：POST `/ontology/space`
 *
 * @param params 创建空间参数。
 * @param {string} params.apiName 空间API名称。
 * @param {string} params.displayName 空间名称。
 * @param {string} [params.iconUrl] 空间图标url。
 * @param {string} [params.description] 空间描述。
 * @returns 标准 API 响应，data 为新创建空间 id。
 */
export function createOntologySpaceInterface(params: CreateOntologySpaceParams): Promise<ApiResponse<CreateOntologySpaceData>> {
  return request<CreateOntologySpaceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    method: "post",
    data: params,
  });
}

/**
 * @description 通过概念模型画布创建本体空间，或向已有空间写入对象、属性和关系。
 * 请求方式：POST `/ontology/space/canvas`
 * @param params 新建空间或已有空间下的画布对象、属性和关系内容。
 * @returns 标准 API 响应，data 包含目标空间 id。
 */
export function createOntologySpaceWithCanvasContentInterface(
  params: CreateOntologySpaceWithCanvasContentParams,
): Promise<ApiResponse<CreateOntologySpaceWithCanvasContentData>> {
  return request<CreateOntologySpaceWithCanvasContentData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/canvas",
    method: "post",
    data: params,
  });
}

/**
 * @description 删除本体空间。
 *
 * 请求方式：DELETE `/ontology/space/{spaceId}`
 *
 * @param params 删除空间参数。
 * @param {number} params.spaceId 空间ID。
 * @returns 标准 API 响应，data 为空对象。
 */
export function deleteOntologySpaceInterface(params: DeleteOntologySpaceParams): Promise<ApiResponse<DeleteOntologySpaceData>> {
  return request<DeleteOntologySpaceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/" + params.spaceId,
    method: "delete",
  });
}

/**
 * @description 编辑本体空间。
 *
 * 请求方式：PUT `/ontology/space`
 *
 * @param params 编辑空间参数。
 * @param {number} params.spaceId 空间ID。
 * @param {string} params.displayName 空间名称。
 * @param {string} [params.iconUrl] 空间图标url。
 * @param {string} [params.description] 空间描述。
 * @returns 标准 API 响应，data 为空对象。
 */
export function updateOntologySpaceInterface(params: UpdateOntologySpaceParams): Promise<ApiResponse<UpdateOntologySpaceData>> {
  return request<UpdateOntologySpaceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    method: "put",
    data: params,
  });
}

/**
 * @description 通过 multipart/form-data 导入文件创建本体空间。
 *
 * 请求方式：POST `/ontology/space/import`
 *
 * @param params 请求参数。
 * @param {File} params.file 导入文件，必填。
 * @returns 标准 API 响应，data 为字符串数组，元素含义文档未说明。
 */
export function postImportOntologySpaceInterface(params: ImportOntologySpaceParams): Promise<ApiResponse<ImportOntologySpaceData>> {
  const formData = new FormData();
  formData.append("file", params.file);
  return request<ImportOntologySpaceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/import",
    method: "post",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * @description 上传图片文件并获取缩略图 URL。
 *
 * 请求方式：POST `/ontology/file/thumbnail`
 *
 * @param params 上传参数。
 * @param {File} params.image 必填图片文件。
 * @returns 标准 API 响应，data 为缩略图 URL 字符串。
 */
export function postUploadOntologyThumbnailInterface(params: UploadOntologyThumbnailParams): Promise<ApiResponse<UploadOntologyThumbnailData>> {
  const formData = new FormData();
  formData.append("image", params.image);
  return request<UploadOntologyThumbnailData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/file/thumbnail",
    method: "post",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * @description 查询本体分类体系树。
 *
 * 请求方式：GET `/ontology`
 *
 * @param params 查询参数。
 * @param params.spaceId 必填空间 id。
 * @returns 标准 API 响应，data 为分类体系单根节点。
 */
export function getOntologyCategoryTreeInterface(params: OntologyCategoryTreeParams): Promise<ApiResponse<OntologyCategoryTreeData>> {
  return request<OntologyCategoryTreeData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/category/tree",
    method: "get",
    params,
  });
}

/**
 * @description 查询空间关系分类体系树。
 *
 * 请求方式：GET `/ontology/link_category/tree`
 *
 * @param params 查询参数。
 * @param {string} params.spaceId 必填空间 id。
 * @returns 标准 API 响应，data 为关系分类体系单根节点；无 data 时表示关系树为空。
 */
export function getOntologyRelationCategoryTreeInterface(params: OntologyRelationCategoryTreeParams): Promise<ApiResponse<OntologyRelationCategoryTreeData>> {
  return request<OntologyRelationCategoryTreeData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/link_category/tree",
    method: "get",
    params,
  });
}

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
    // url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    method: "get",
  });
}

/**
 * @description 获取本体概览页面的资源数量统计。
 *
 * 请求方式：GET `/ontology/overview/count`
 *
 * @returns 标准 API 响应，data 为本体空间、对象、行为、函数、属性和关系统计数据。
 */
export function getOntologyOverviewCountInterface(): Promise<ApiResponse<GetOntologyOverviewCountData>> {
  return request<GetOntologyOverviewCountData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/overview/count",
    method: "get",
  });
}

/**
 * @description 查询指定本体空间下的资源数量统计。
 *
 * 请求方式：GET `/ontology/space/statistic`
 *
 * @param params 查询参数。
 * @param {number} params.spaceId 本体空间 id，必填。
 * @returns 标准 API 响应，data 为本体空间资源统计对象。
 */
export function getOntologySpaceStatisticInterface(params: GetOntologySpaceStatisticParams): Promise<ApiResponse<GetOntologySpaceStatisticData>> {
  return request<GetOntologySpaceStatisticData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/statistic",
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
function readExportResponseHeader(headers: AxiosResponse["headers"], name: string): string {
  const raw = headers[name];
  return typeof raw === "string" ? raw : "";
}

/**
 * @description 按 exportType 导出本体空间。SCHEMA 表示仅结构，INSTANCE 表示含实例数据。
 *
 * 请求方式：GET `/ontology/space/export`
 *
 * 在线文档未声明 JSON 响应体，成功结果按文件字节返回。
 * @param params 查询参数。
 * @param {number} params.spaceId 本体空间 id，必填。
 * @param {string} params.exportType 导出类型，必填。SCHEMA 表示仅结构，INSTANCE 表示含实例数据。
 * @returns 文件内容和用于命名的响应头。
 */
export async function getExportOntologySpaceInterface(params: ExportOntologySpaceParams): Promise<ExportOntologySpaceFile> {
  const response = await requestFull<Blob>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/export",
    method: "get",
    params,
    responseType: "blob",
  });
  if (!(response.data instanceof Blob)) {
    throw new RequestError("导出失败，请重试。");
  }
  return {
    blob: response.data,
    contentDisposition: readExportResponseHeader(response.headers, "content-disposition"),
    contentType: readExportResponseHeader(response.headers, "content-type"),
  };
}

/**
 * @description 创建本体分类体系树。
 *
 * 请求方式：POST `/ontology/category/`
 *
 * @param payload 创建参数。
 * @param {number} payload.spaceId 当前空间 id，数字。
 * @param {number} payload.parentId 父级分类 id，数字，根分类为 0。
 * @param {string} payload.name 主分类名称。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function postCreateOntologyCategoryTreeInterface(payload: CreateOntologyCategoryTreeParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/category",
    method: "post",
    data: payload,
  });
}

/**
 * @description 创建空间关系分类体系树。
 *
 * 请求方式：POST `/ontology/link_category`
 *
 * @param payload 创建参数。
 * @param {number} payload.spaceId 当前空间 id，数字。
 * @param {number} payload.parentId 父级分类 id，数字，根分类为 0。
 * @param {string} payload.name 分类名称。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function postCreateOntologyRelationCategoryTreeInterface(payload: CreateOntologyRelationCategoryTreeParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/link_category",
    method: "post",
    data: payload,
  });
}

/**
 * @description 修改空间关系分类名称。
 *
 * 请求方式：PUT `/ontology/link_category`
 *
 * @param payload 修改参数。
 * @param {number} payload.spaceId 当前空间 id，数字。
 * @param {number} payload.categoryId 要修改的分类 id，数字。
 * @param {string} payload.name 新的分类名称。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function putUpdateOntologyRelationCategoryNameInterface(payload: UpdateOntologyRelationCategoryNameParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/link_category",
    method: "put",
    data: payload,
  });
}

/**
 * @description 删除空间关系分类。
 *
 * 请求方式：DELETE `/ontology/link_category`
 *
 * @param payload 删除参数。
 * @param {number} payload.spaceId 当前空间 id，数字。
 * @param {number} payload.categoryId 要删除的分类 id，数字。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function deleteOntologyRelationCategoryTreeInterface(payload: DeleteOntologyRelationCategoryTreeParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/link_category",
    method: "delete",
    data: payload,
  });
}

/**
 * @description 创建本体之间的关系。
 *
 * 请求方式：POST `/ontology/link`
 *
 * @param payload 创建参数。
 * @param {string} payload.name 关系名称。
 * @param {string} payload.ontologyUniqueIdentifierFrom 源本体唯一标识。
 * @param {string} payload.ontologyUniqueIdentifierTo 目标本体唯一标识。
 * @param {number} [payload.categoryId] 关系分类 id，非必填。
 * @param {string} payload.apiName 关系 API 名称。
 * @param {string} [payload.description] 关系备注/描述，非必填。
 * @param {number} payload.spaceId 关系所属空间 id。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function postCreateOntologyLinkInterface(payload: CreateOntologyLinkParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/link",
    method: "post",
    data: payload,
  });
}

/**
 * @description 修改本体之间的关系名称、分类与描述。
 *
 * 请求方式：PUT `/ontology/link`
 *
 * @param payload 修改参数。
 * @param {string} payload.uniqueIdentifier 关系唯一标识。
 * @param {string} payload.name 关系名称。
 * @param {number} payload.categoryId 关系分类 id。
 * @param {string} payload.description 关系描述。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function putUpdateOntologyLinkInterface(payload: UpdateOntologyLinkParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/link",
    method: "put",
    data: payload,
  });
}

/**
 * @description 删除本体之间的关系。
 *
 * 请求方式：DELETE `/ontology/link/{linkUniqIdentifier}`
 *
 * @param payload 删除参数。
 * @param {string} payload.linkUniqIdentifier 关系唯一标识（路径参数）。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function deleteOntologyLinkInterface(payload: DeleteOntologyLinkParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/link/" + encodeURIComponent(payload.linkUniqIdentifier),
    method: "delete",
  });
}

/**
 * @description 删除本体分类体系树节点。
 *
 * 请求方式：DELETE `/ontology/category`
 *
 * @param payload 删除参数。
 * @param {number} payload.spaceId 当前空间 id，数字。
 * @param {number} payload.categoryId 要删除的分类 id，数字。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function deleteOntologyCategoryTreeInterface(payload: DeleteOntologyCategoryTreeParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/category",
    method: "delete",
    data: payload,
  });
}

/**
 * @description 修改本体分类名称。
 *
 * 请求方式：PUT `/ontology/category`
 *
 * @param payload 修改参数。
 * @param {number} payload.spaceId 当前空间 id，数字。
 * @param {number} payload.categoryId 要修改的分类 id，数字。
 * @param {string} payload.name 新的分类名称。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function putUpdateOntologyCategoryNameInterface(payload: UpdateOntologyCategoryNameParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/category",
    method: "put",
    data: payload,
  });
}
