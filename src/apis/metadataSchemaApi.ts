import type { ApiResponse, MetadataSchemaCreateParams, MetadataSchemaDeleteParams, MetadataSchemaUpdateParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description GET /ontology/property/metadata_schema/tree 查询元数据树，数据结构由调用方校验。
 * @param ontologyUniqueIdentifier 当前对象标识。
 * @returns 未经结构假设的标准查询响应。
 */
export function getMetadataSchemaInterface(ontologyUniqueIdentifier: string): Promise<ApiResponse<unknown>> {
  return request<unknown>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/metadata_schema/tree",
    method: "get",
    params: { ontologyUniqueIdentifier },
  });
}

/**
 * @description POST /ontology/property/metadata_schema 新增指定父级下的元数据。
 * @param data 对象标识、父节点 ID、名称及取值类型和内容。
 * @returns 标准命令响应，不依赖返回 data。
 */
export function postMetadataSchemaInterface(data: MetadataSchemaCreateParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/metadata_schema", method: "post", data });
}

/**
 * @description PUT /ontology/property/metadata_schema 更新元数据名称和取值。
 * @param data 对象标识、schema ID、名称及取值类型和内容。
 * @returns 标准命令响应，不依赖返回 data。
 */
export function putMetadataSchemaInterface(data: MetadataSchemaUpdateParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/metadata_schema", method: "put", data });
}

/**
 * @description DELETE /ontology/property/metadata_schema 通过 JSON 请求体删除元数据。
 * @param data 对象标识和待删除 schema ID。
 * @returns 标准命令响应，不依赖返回 data。
 */
export function deleteMetadataSchemaInterface(data: MetadataSchemaDeleteParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/metadata_schema", method: "delete", data });
}
