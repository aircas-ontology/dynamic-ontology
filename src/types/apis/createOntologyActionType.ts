/** 创建行为请求中的行为类别。 */
export type CreateOntologyActionKind = "BASE" | "APPLICATION";

/** 创建行为请求中的主体类型。 */
export type CreateOntologyActionSubjectType = "PROPERTY_VALUE" | "LINK" | "BASIC_OPERATOR";

/** 创建行为请求中的基础操作。 */
export type CreateOntologyActionOperation = "CREATE" | "UPDATE" | "DELETE";

/** 创建行为 mappingIns 的取值来源类型。 */
export type CreateOntologyActionSourceType = "PROPERTY" | "EXTERNAL" | "FIXED";

/** 创建行为输出模式。 */
export type CreateOntologyActionOutputMode = "RESULT_ONLY" | "WRITE_PROPERTY";

/** 创建行为 mappingIns 单项（属性值 / 基础算子 / 应用行为按字段选用）。 */
export interface CreateOntologyActionMappingIn {
  /** 属性唯一标识；属性值行为及 PROPERTY 绑定必填。 */
  propertyUniqueIdentifier?: string;
  /** 本体标识；属性值行为常用。 */
  ontologyUniqueIdentifier?: string;
  /** 函数入参 id；基础算子 / 应用行为绑定必填。 */
  functionParamId?: number;
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
  targetStatus?: "ENABLE" | "DISABLE" | "DELETE";
  visibilityWindows?: CreateOntologyActionVisibilityWindow[];
}

/** 创建行为请求体（属性值 / 关系实例 / 基础算子等路径按 subjectType 选用字段）。 */
export interface CreateOntologyActionParams {
  actionApi: string;
  displayName: string;
  description?: string;
  categoryId: number;
  ontologyIdentifier: string;
  actionKind: CreateOntologyActionKind;
  subjectType: CreateOntologyActionSubjectType;
  /** 属性值 / 关系实例行为必填；基础算子行为不传。 */
  operation?: CreateOntologyActionOperation;
  /** 属性值行为必填。 */
  storageGroup?: string;
  /** 基础算子 / 应用行为：绑定的函数 api。 */
  functionApi?: string;
  /** 基础算子固定 RESULT_ONLY；应用行为必填。 */
  outputMode?: CreateOntologyActionOutputMode;
  /** 属性值 / 基础算子等路径的入参绑定。 */
  mappingIns?: CreateOntologyActionMappingIn[];
  /** 关系实例行为必填。 */
  linkMapping?: CreateOntologyActionLinkMapping;
}

/** 创建行为成功响应 data；文档约定为 null。 */
export type CreateOntologyActionData = null;

/** 编辑行为请求体；与创建一致，靠 actionApi 定位。 */
export type EditOntologyActionParams = CreateOntologyActionParams;

/** 编辑行为成功响应 data；文档约定为 null。 */
export type EditOntologyActionData = null;
