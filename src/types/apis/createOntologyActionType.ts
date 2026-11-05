/** 创建行为请求中的行为类别。 */
export type CreateOntologyActionKind = "BASE" | "APPLICATION";

/** 创建行为请求中的主体类型。 */
export type CreateOntologyActionSubjectType = "PROPERTY_VALUE" | "LINK" | "BASIC_OPERATOR";

/** 创建行为请求中的基础操作。 */
export type CreateOntologyActionOperation = "CREATE" | "UPDATE" | "DELETE";

/** 创建行为 mappingIns 的取值来源类型。 */
export type CreateOntologyActionSourceType = "PROPERTY" | "EXTERNAL" | "FIXED";

/** 创建行为 mappingIns 参数类别。 */
export type CreateOntologyActionMappingCategory = "INPUT" | "OUTPUT";

/** 创建行为输出模式。 */
export type CreateOntologyActionOutputMode = "RESULT_ONLY" | "WRITE_PROPERTY";

/** 创建行为 mappingIns 单项（属性值 / 基础算子 / 应用行为按字段选用）。 */
export interface CreateOntologyActionMappingIn {
  /** 属性唯一标识；属性值行为及 PROPERTY / WRITE_PROPERTY 绑定必填。 */
  propertyUniqueIdentifier?: string;
  /** 本体标识；属性值行为及 PROPERTY / WRITE_PROPERTY 常用。 */
  ontologyUniqueIdentifier?: string;
  /** 函数入参 / 出参 id；基础算子 / 应用行为绑定必填。 */
  functionParamId?: number;
  parameterName?: string;
  /** 应用行为 mappingIns 入出参类别。 */
  category?: CreateOntologyActionMappingCategory;
  sourceType?: CreateOntologyActionSourceType;
  sourceConfig?: string;
  /** 对象入参子字段路径；应用行为叶子绑定可选。 */
  paramPath?: string;
  /** 出参 JsonPath；WRITE_PROPERTY 时必填。 */
  functionParamExpression?: string;
  /** 出参输出方式；应用行为出参行使用。 */
  outputMode?: CreateOntologyActionOutputMode;
}

/** 关系实例行为持续时段。 */
export interface CreateOntologyActionVisibilityWindow {
  startTime: number;
  endTime: number;
}

/** 关系实例 / 应用行为 linkMapping。 */
export interface CreateOntologyActionLinkMapping {
  ontologyLinkUniqIdentifier: string;
  targetStatus?: "ENABLE" | "DISABLE" | "DELETE";
  visibilityWindows?: CreateOntologyActionVisibilityWindow[];
}

/** 创建行为请求体（属性值 / 关系实例 / 基础算子 / 应用行为按字段选用）。 */
export interface CreateOntologyActionParams {
  actionApi: string;
  displayName: string;
  description?: string;
  categoryId: number;
  /** 基础行为必填；应用行为不传。 */
  ontologyIdentifier?: string;
  actionKind: CreateOntologyActionKind;
  /** 基础行为必填；应用行为不传。 */
  subjectType?: CreateOntologyActionSubjectType;
  /** 属性值 / 关系实例行为必填；基础算子 / 应用行为不传。 */
  operation?: CreateOntologyActionOperation;
  /** 属性值行为必填。 */
  storageGroup?: string;
  /** 基础算子 / 应用行为：绑定的函数 api。 */
  functionApi?: string;
  /** 基础算子固定 RESULT_ONLY；应用行为不传顶层 outputMode。 */
  outputMode?: CreateOntologyActionOutputMode;
  /** 属性值 / 基础算子 / 应用行为的参数绑定。 */
  mappingIns?: CreateOntologyActionMappingIn[];
  /** 关系实例 / 应用行为必填。 */
  linkMapping?: CreateOntologyActionLinkMapping;
}

/** 创建行为成功响应 data；文档约定为 null。 */
export type CreateOntologyActionData = null;

/** 编辑行为请求体；与创建一致，靠 actionApi 定位。 */
export type EditOntologyActionParams = CreateOntologyActionParams;

/** 编辑行为成功响应 data；文档约定为 null。 */
export type EditOntologyActionData = null;
