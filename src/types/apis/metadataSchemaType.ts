/** 后端元数据取值类型。 */
export type MetadataSchemaValueType = "INPUT" | "ENUM" | "RANGE";

/** 新增元数据请求。 */
export interface MetadataSchemaCreateParams {
  ontologyIdentifier: string;
  parentId: number;
  name: string;
  valueType: MetadataSchemaValueType;
  value: string;
}

/** 修改元数据请求。 */
export interface MetadataSchemaUpdateParams {
  ontologyIdentifier: string;
  metadataSchemaId: number;
  parentId?: number;
  name: string;
  valueType: MetadataSchemaValueType;
  value: string | null;
}

/** 删除元数据请求。 */
export interface MetadataSchemaDeleteParams {
  ontologyIdentifier: string;
  metadataSchemaId: number;
}
