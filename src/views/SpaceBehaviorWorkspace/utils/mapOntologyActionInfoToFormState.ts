import type {
  GetOntologyActionInfoData,
  SpaceBehaviorBasicAction,
  SpaceBehaviorKind,
  SpaceBehaviorRelationTargetStatus,
  SpaceBehaviorRelationVisibilityWindow,
  SpaceBehaviorStatus,
  SpaceBehaviorValueType,
} from "@/types";
import { mapApplicationActionInfoBindingSeeds, type SpaceBehaviorApplicationBindingSeed } from "./applyApplicationActionInfoBindings.ts";

/** 行为详情映射后的表单回填状态。 */
export interface SpaceBehaviorActionInfoFormState {
  kind: SpaceBehaviorKind;
  valueType: SpaceBehaviorValueType;
  displayName: string;
  behaviorApiName: string;
  description: string;
  categoryId: string;
  status: SpaceBehaviorStatus;
  basicAction: SpaceBehaviorBasicAction;
  ontologyIdentifier: string;
  functionOperatorId: string;
  functionOperatorName: string;
  storageGroup: string;
  selectedPropertyIds: string[];
  selectedPropertyValues: Record<string, string>;
  selectedPropertyApiNames: Record<string, string>;
  selectedRelationId: string;
  relationTargetStatus: SpaceBehaviorRelationTargetStatus | "";
  relationVisibilityWindows: SpaceBehaviorRelationVisibilityWindow[];
  operatorParamBindings: Record<string, string>;
  operatorParamIds: Record<string, number>;
  /** 应用行为详情 mappingIns 回填种子。 */
  applicationBindingSeeds: SpaceBehaviorApplicationBindingSeed[];
  /** 本轮不支持远程编辑保存时的原因；空表示可保存。 */
  unsupportedEditReason: string;
}

/**
 * @description 将详情状态码映射为工作区行为状态。
 * @param status 接口状态：1 已发布，2 草稿。
 * @returns published 或 draft。
 */
function mapActionInfoStatus(status: number): SpaceBehaviorStatus {
  return status === 1 ? "published" : "draft";
}

/**
 * @description 将接口 actionKind 映射为表单类别。
 * @param actionKind 接口行为类别。
 * @returns 工作区 kind。
 */
function mapActionKind(actionKind: string): SpaceBehaviorKind {
  if (actionKind === "APPLICATION") return "application";
  return "basic";
}

/**
 * @description 将接口 subjectType 映射为行为类型。
 * @param subjectType 接口主体类型。
 * @returns 工作区 valueType。
 */
function mapSubjectType(subjectType: string): SpaceBehaviorValueType {
  if (subjectType === "LINK") return "relationInstance";
  if (subjectType === "BASIC_OPERATOR") return "basicFunctionOperator";
  return "attributeValue";
}

/**
 * @description 将接口 operation 映射为基础操作。
 * @param operation 接口操作。
 * @returns 工作区 basicAction。
 */
function mapOperation(operation: string): SpaceBehaviorBasicAction {
  if (operation === "UPDATE") return "update";
  if (operation === "DELETE") return "delete";
  if (operation === "QUERY") return "query";
  return "create";
}

/**
 * @description 将详情 targetStatus 收窄为表单可选值。
 * @param value 详情状态。
 * @returns ENABLE / DISABLE / DELETE 或空。
 */
function mapRelationTargetStatus(value: string | null | undefined): SpaceBehaviorRelationTargetStatus | "" {
  if (value === "ENABLE" || value === "DISABLE" || value === "DELETE") return value;
  return "";
}

/**
 * @description 将详情持续时段时间值解析为有限毫秒时间戳。
 * @param value 毫秒数字、数字字符串或 ISO 时间字符串。
 * @returns 有限毫秒；无法解析时为 NaN。
 */
function parseVisibilityWindowTimestamp(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) return asNumber;
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : Number.NaN;
  }
  return Number.NaN;
}

/**
 * @description 将详情 visibilityWindows 映射为表单毫秒时段列表。
 * @param windows 详情持续时段。
 * @returns 合法毫秒时段；非法项丢弃。
 */
function mapRelationVisibilityWindows(windows: Array<{ startTime?: unknown; endTime?: unknown }> | null | undefined): SpaceBehaviorRelationVisibilityWindow[] {
  if (!Array.isArray(windows)) return [];
  const result: SpaceBehaviorRelationVisibilityWindow[] = [];
  for (const item of windows) {
    if (!item || typeof item !== "object") continue;
    const startTime = parseVisibilityWindowTimestamp(item.startTime);
    const endTime = parseVisibilityWindowTimestamp(item.endTime);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) continue;
    result.push({ startTime, endTime });
  }
  return result;
}

/**
 * @description 将行为详情接口 data 映射为编辑弹窗可回填状态。
 * @param data 行为详情。
 * @returns 表单状态；暂不支持编辑的类型会带 unsupportedEditReason。
 */
export function mapOntologyActionInfoToFormState(data: GetOntologyActionInfoData): SpaceBehaviorActionInfoFormState {
  const actionKind = typeof data.actionKind === "string" ? data.actionKind.trim() : "";
  const subjectType = typeof data.subjectType === "string" ? data.subjectType.trim() : "";
  const kind = mapActionKind(actionKind);
  const valueType = kind === "application" ? "attributeValue" : mapSubjectType(subjectType);
  const operation = typeof data.operation === "string" ? data.operation.trim() : "";
  const ontologyIdentifier = (data.ontologyUniqIdentifier ?? "").trim();
  const functionOperatorId = (data.functionApi ?? "").trim();
  const functionOperatorName = (data.functionDescription ?? "").trim() || functionOperatorId;
  const storageGroup = (data.storageGroup ?? "").trim();
  const mappingIns = Array.isArray(data.mappingIns) ? data.mappingIns : [];

  const selectedPropertyIds: string[] = [];
  const selectedPropertyValues: Record<string, string> = {};
  const selectedPropertyApiNames: Record<string, string> = {};
  const operatorParamBindings: Record<string, string> = {};
  const operatorParamIds: Record<string, number> = {};

  if (subjectType === "PROPERTY_VALUE") {
    for (const item of mappingIns) {
      const propertyId = typeof item.propertyUniqueIdentifier === "string" ? item.propertyUniqueIdentifier.trim() : "";
      if (!propertyId) continue;
      selectedPropertyIds.push(propertyId);
      selectedPropertyValues[propertyId] = typeof item.sourceConfig === "string" ? item.sourceConfig : "";
      const apiName = typeof item.parameterName === "string" ? item.parameterName.trim() : "";
      if (apiName) selectedPropertyApiNames[propertyId] = apiName;
    }
  }

  if (subjectType === "BASIC_OPERATOR") {
    for (const item of mappingIns) {
      const parameterName = typeof item.parameterName === "string" ? item.parameterName.trim() : "";
      if (!parameterName) continue;
      operatorParamBindings[parameterName] = typeof item.sourceConfig === "string" ? item.sourceConfig.trim() : "";
      if (typeof item.functionParamId === "number" && Number.isInteger(item.functionParamId)) {
        operatorParamIds[parameterName] = item.functionParamId;
      }
    }
  }

  const linkMapping = data.linkMapping;
  const selectedRelationId =
    (kind === "application" || subjectType === "LINK") && typeof linkMapping?.ontologyLinkUniqIdentifier === "string"
      ? linkMapping.ontologyLinkUniqIdentifier.trim()
      : "";
  const relationTargetStatus = subjectType === "LINK" ? mapRelationTargetStatus(linkMapping?.targetStatus) : "";
  const relationVisibilityWindows: SpaceBehaviorRelationVisibilityWindow[] =
    subjectType === "LINK" ? mapRelationVisibilityWindows(linkMapping?.visibilityWindows) : [];

  const applicationBindingSeeds = kind === "application" ? mapApplicationActionInfoBindingSeeds(data.mappingIns, data.functionParams) : [];

  let unsupportedEditReason = "";
  if (kind !== "application" && subjectType !== "PROPERTY_VALUE" && subjectType !== "LINK" && subjectType !== "BASIC_OPERATOR") {
    unsupportedEditReason = "当前行为类型暂不支持编辑保存";
  }

  return {
    kind,
    valueType,
    displayName: (data.displayName ?? "").trim() || (data.actionApi ?? "").trim(),
    behaviorApiName: (data.actionApi ?? "").trim(),
    description: (data.description ?? "").trim(),
    categoryId: String(data.categoryId),
    status: mapActionInfoStatus(data.status),
    basicAction: mapOperation(operation),
    ontologyIdentifier,
    functionOperatorId,
    functionOperatorName,
    storageGroup,
    selectedPropertyIds,
    selectedPropertyValues,
    selectedPropertyApiNames,
    selectedRelationId,
    relationTargetStatus,
    relationVisibilityWindows,
    operatorParamBindings,
    operatorParamIds,
    applicationBindingSeeds,
    unsupportedEditReason,
  };
}
