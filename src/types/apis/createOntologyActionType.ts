/** 创建行为请求中的行为类别。 */
export type CreateOntologyActionKind = "BASE" | "APPLICATION";

/** 创建行为请求中的主体类型。 */
export type CreateOntologyActionSubjectType = "PROPERTY_VALUE" | "LINK" | "BASIC_OPERATOR";

/** 创建行为请求中的基础操作。 */
export type CreateOntologyActionOperation = "CREATE" | "UPDATE" | "DELETE";

/** 创建行为 mappingIns 的取值来源类型。 */
export type CreateOntologyActionSourceType = "PROPERTY" | "EXTERNAL" | "FIXED";

/** 属性值行为 mappingIns 单项。 */
export interface CreateOntologyActionMappingIn {
  propertyUniqueIdentifier: string;
  ontologyUniqueIdentifier: string;
  parameterName?: string;
  sourceType?: CreateOntologyActionSourceType;
  sourceConfig?: string;
}

/** 创建行为请求体（本轮属性值路径使用）。 */
export interface CreateOntologyActionParams {
  actionApi: string;
  displayName: string;
  description?: string;
  categoryId: number;
  ontologyIdentifier: string;
  actionKind: CreateOntologyActionKind;
  subjectType: CreateOntologyActionSubjectType;
  operation: CreateOntologyActionOperation;
  storageGroup: string;
  mappingIns: CreateOntologyActionMappingIn[];
}

/** 创建行为成功响应 data；文档约定为 null。 */
export type CreateOntologyActionData = null;
