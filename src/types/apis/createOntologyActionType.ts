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

/** 关系实例行为持续时段。 */
export interface CreateOntologyActionVisibilityWindow {
  startTime: number;
  endTime: number;
}

/** 关系实例行为 linkMapping。 */
export interface CreateOntologyActionLinkMapping {
  ontologyLinkUniqIdentifier: string;
  targetStatus?: "ENABLE" | "DELETE";
  visibilityWindows?: CreateOntologyActionVisibilityWindow[];
}

/** 创建行为请求体（属性值 / 关系实例等路径按 subjectType 选用字段）。 */
export interface CreateOntologyActionParams {
  actionApi: string;
  displayName: string;
  description?: string;
  categoryId: number;
  ontologyIdentifier: string;
  actionKind: CreateOntologyActionKind;
  subjectType: CreateOntologyActionSubjectType;
  operation: CreateOntologyActionOperation;
  /** 属性值行为必填。 */
  storageGroup?: string;
  /** 属性值行为必填。 */
  mappingIns?: CreateOntologyActionMappingIn[];
  /** 关系实例行为必填。 */
  linkMapping?: CreateOntologyActionLinkMapping;
}

/** 创建行为成功响应 data；文档约定为 null。 */
export type CreateOntologyActionData = null;
