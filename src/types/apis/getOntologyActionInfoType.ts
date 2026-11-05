import type {
  CreateOntologyActionKind,
  CreateOntologyActionOperation,
  CreateOntologyActionOutputMode,
  CreateOntologyActionSourceType,
  CreateOntologyActionSubjectType,
} from "./createOntologyActionType";

/** 行为详情查询参数。 */
export interface GetOntologyActionInfoParams {
  /** 行为 api 名称。 */
  actionApi: string;
  /** 本体空间 id。 */
  ontologySpaceId: string;
}

/** 行为详情 mappingIns 单项。 */
export interface GetOntologyActionInfoMappingIn {
  functionParamId?: number | null;
  parameterName?: string | null;
  /** 属性展示名称；部分详情响应会返回。 */
  displayName?: string | null;
  /** 属性类型；部分详情响应会返回。 */
  propertyType?: string | null;
  /** 入出参类别；部分详情响应会返回。 */
  category?: "INPUT" | "OUTPUT" | string | null;
  sourceType?: CreateOntologyActionSourceType | string | null;
  sourceConfig?: string | null;
  paramPath?: string | null;
  propertyUniqueIdentifier?: string | null;
  ontologyUniqueIdentifier?: string | null;
  functionParamExpression?: string | null;
  /** 出参输出方式；部分详情响应会返回。 */
  outputMode?: CreateOntologyActionOutputMode | string | null;
}

/** 行为详情持续时段；详情接口可能返回毫秒数字或 ISO 时间字符串。 */
export interface GetOntologyActionInfoVisibilityWindow {
  startTime: number | string;
  endTime: number | string;
}

/** 行为详情 linkMapping。 */
export interface GetOntologyActionInfoLinkMapping {
  ontologyLinkUniqIdentifier?: string | null;
  ontologyLinkFunctionParamExpression?: string | null;
  targetStatus?: "ENABLE" | "DELETE" | "DISABLE" | string | null;
  visibilityWindows?: GetOntologyActionInfoVisibilityWindow[] | null;
}

/** 行为详情 functionParams 单项。 */
export interface GetOntologyActionInfoFunctionParam {
  paramId: number;
  paramName: string;
  paramType: string;
  category: string;
  paramOrder: number;
  description?: string | null;
  referenceType?: string | null;
}

/** 行为详情 data。 */
export interface GetOntologyActionInfoData {
  id: number;
  actionApi: string;
  displayName: string;
  description?: string | null;
  ontologyUniqIdentifier: string;
  categoryId: number;
  /** 1 启用，0 失效。 */
  status: number;
  actionKind: CreateOntologyActionKind | string;
  subjectType?: CreateOntologyActionSubjectType | string | null;
  operation?: CreateOntologyActionOperation | string | null;
  storageGroup?: string | null;
  functionApi?: string | null;
  functionDescription?: string | null;
  outputMode?: CreateOntologyActionOutputMode | string | null;
  linkMapping?: GetOntologyActionInfoLinkMapping | null;
  mappingIns?: GetOntologyActionInfoMappingIn[] | null;
  functionParams?: GetOntologyActionInfoFunctionParam[] | null;
}
