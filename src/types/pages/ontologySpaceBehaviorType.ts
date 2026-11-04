/** 空间内行为工作台业务契约。 */

export const ROOT_SPACE_BEHAVIOR_CATEGORY_ID = "behavior-root";

export type SpaceBehaviorStatus = "published" | "draft" | "disabled";

/** 行为列表筛选项：对接 listAction 的已发布/草稿。 */
export type SpaceBehaviorListStatus = "published" | "draft";

export type SpaceBehaviorStatusOperation = "publish" | "disable" | "draft";

export type SpaceBehaviorBasicAction = "create" | "update" | "delete" | "query";

/** 行为创建表单顶层类别：基础行为 / 应用行为 / 行为树。 */
export type SpaceBehaviorKind = "basic" | "application" | "behaviorTree";

/** 基础行为的行为类型。 */
export type SpaceBehaviorValueType = "attributeValue" | "relationInstance" | "basicFunctionOperator";

/** 关系实例 linkMapping.targetStatus。 */
export type SpaceBehaviorRelationTargetStatus = "ENABLE" | "DISABLE" | "DELETE";

/** 应用行为入参绑定的输入来源。 */
export type SpaceBehaviorApplicationInputSourceType = "PROPERTY" | "FIXED" | "EXTERNAL";

/** 应用行为单个入参（或对象子字段）的本地绑定草稿。 */
export interface SpaceBehaviorApplicationInputBinding {
  sourceType: SpaceBehaviorApplicationInputSourceType;
  /** sourceType=PROPERTY 时选中的对象 uniqueIdentifier。 */
  ontologyUniqueIdentifier: string;
  /** sourceType=PROPERTY 时的属性 uniqueIdentifier。 */
  propertyUniqueIdentifier: string;
  /** sourceType=FIXED 时的固定值字面量。 */
  fixedValue: string;
  /** sourceType=EXTERNAL 时是否启用默认值。 */
  enableDefaultValue: boolean;
  /** 外部输入启用默认值时的字面量。 */
  defaultValue: string;
}

/** 应用行为出参绑定的输出方式。 */
export type SpaceBehaviorApplicationOutputMode = "RESULT_ONLY" | "WRITE_PROPERTY";

/** 应用行为单个出参（或对象子字段）的本地绑定草稿。 */
export interface SpaceBehaviorApplicationOutputBinding {
  outputMode: SpaceBehaviorApplicationOutputMode;
  /** outputMode=WRITE_PROPERTY 时选中的对象 uniqueIdentifier。 */
  ontologyUniqueIdentifier: string;
  /** outputMode=WRITE_PROPERTY 时的写入属性 uniqueIdentifier。 */
  propertyUniqueIdentifier: string;
}

/** 关系实例持续时段（epoch millis）。 */
export interface SpaceBehaviorRelationVisibilityWindow {
  startTime: number;
  endTime: number;
}

export type SpaceBehaviorWorkspaceLoadStatus = "loading" | "ready" | "empty" | "error";

/** 行为分类树节点类型：分类或行为叶子。 */
export type SpaceBehaviorCategoryNodeKind = "category" | "action";

export interface SpaceBehaviorCategoryNode {
  id: string;
  label: string;
  kind: SpaceBehaviorCategoryNodeKind;
  count: number;
  children: SpaceBehaviorCategoryNode[];
  /** 行为叶子所属分类 id。 */
  parentCategoryId?: string;
  /** 行为叶子对应的 actionApi。 */
  actionApi?: string;
}

export interface SpaceBehaviorParameter {
  id: string;
  name: string;
  path: string;
  type: string;
  required: boolean;
  description: string;
  sourceLabel: string;
  bindLabel: string;
  configured: boolean;
  children: SpaceBehaviorParameter[];
}

export interface SpaceBehaviorOperatorOption {
  id: string;
  name: string;
  version: string;
  basicAction: SpaceBehaviorBasicAction;
  objectName: string;
  inputParameters: SpaceBehaviorParameter[];
  outputParameters: SpaceBehaviorParameter[];
}

export interface SpaceBehaviorItem {
  id: string;
  categoryId: string;
  displayName: string;
  kind: SpaceBehaviorKind;
  valueType: SpaceBehaviorValueType;
  functionOperatorId: string;
  functionOperatorName: string;
  functionOperatorVersion: string;
  description: string;
  status: SpaceBehaviorStatus;
  version: string;
  basicAction: SpaceBehaviorBasicAction;
  objectName: string;
  behaviorApiName: string;
  executionPeriod: string;
  singleObject: boolean;
  executionCount: number;
  successRate: string;
  publisher: string;
  publishedAt: string;
  changeNote: string;
  statusLogs: string[];
  inputParameters: SpaceBehaviorParameter[];
  outputParameters: SpaceBehaviorParameter[];
  updatedAt: string;
}

export interface SpaceBehaviorDraft {
  displayName: string;
  behaviorApiName: string;
  kind: SpaceBehaviorKind;
  valueType: SpaceBehaviorValueType;
  functionOperatorId: string;
  functionOperatorName: string;
  /** 基础函数算子版本。 */
  functionOperatorVersion: string;
  description: string;
  categoryId: string;
  status: SpaceBehaviorStatus;
  basicAction: SpaceBehaviorBasicAction;
  /** 属性值新增 / 基础函数算子：选中对象唯一标识。 */
  ontologyIdentifier: string;
  /** 基础函数算子：参数名 → 属性 apiName。 */
  operatorParamBindings: Record<string, string>;
  /** 基础函数算子：参数名 → 详情 paramId（functionParamId）。 */
  operatorParamIds: Record<string, number>;
  /** 属性值新增：勾选属性 uniqueIdentifier 列表。 */
  selectedPropertyIds: string[];
  /** 属性值新增/修改：属性 uniqueIdentifier 对应的录入值。 */
  selectedPropertyValues: Record<string, string>;
  /** 属性值提交：属性 uniqueIdentifier 对应的 apiName，供 mappingIns.parameterName。 */
  selectedPropertyApiNames: Record<string, string>;
  /** 属性值新增：当前勾选属性所属存储分组。 */
  storageGroup: string;
  /** 关系实例：选中关系 uniqueIdentifier。 */
  selectedRelationId: string;
  /** 关系实例新增/修改：目标边状态。 */
  relationTargetStatus: SpaceBehaviorRelationTargetStatus | "";
  /** 关系实例新增/修改：持续时段列表。 */
  relationVisibilityWindows: SpaceBehaviorRelationVisibilityWindow[];
  changeNote?: string;
  version?: string;
}

export interface SpaceBehaviorStatusChangeDraft {
  operation: SpaceBehaviorStatusOperation;
  reason: string;
}

export interface SpaceBehaviorReferenceCheckResult {
  passed: boolean;
  count: number;
  summary: string;
}

export interface SpaceBehaviorDeletePreflight {
  canDelete: boolean;
  behaviorName: string;
  impactSummary: string;
  references: Array<{
    id: string;
    sourceName: string;
    type: "behavior-tree" | "behavior-schedule";
    detail: string;
  }>;
}

export interface SpaceBehaviorWorkspaceData {
  categoryTree: SpaceBehaviorCategoryNode[];
  behaviors: SpaceBehaviorItem[];
}

export const SPACE_BEHAVIOR_STATUS_OPTIONS: ReadonlyArray<{ value: SpaceBehaviorStatus; label: string }> = [
  { value: "published", label: "已发布" },
  { value: "draft", label: "草稿" },
  { value: "disabled", label: "停用" },
];

export const SPACE_BEHAVIOR_STATUS_LABELS: Record<SpaceBehaviorStatus, string> = {
  published: "已发布",
  draft: "草稿",
  disabled: "停用",
};

export const SPACE_BEHAVIOR_LIST_STATUS_OPTIONS: ReadonlyArray<{ value: SpaceBehaviorListStatus; label: string }> = [
  { value: "published", label: "已发布" },
  { value: "draft", label: "草稿" },
];

export const SPACE_BEHAVIOR_LIST_STATUS_LABELS: Record<SpaceBehaviorListStatus, string> = {
  published: "已发布",
  draft: "草稿",
};

export const SPACE_BEHAVIOR_STATUS_OPERATION_OPTIONS: ReadonlyArray<{ value: SpaceBehaviorStatusOperation; label: string }> = [
  { value: "publish", label: "发布" },
  { value: "disable", label: "停用" },
  { value: "draft", label: "转草稿" },
];

export const SPACE_BEHAVIOR_STATUS_OPERATION_LABELS: Record<SpaceBehaviorStatusOperation, string> = {
  publish: "发布",
  disable: "停用",
  draft: "转草稿",
};

export const SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS: ReadonlyArray<{ value: SpaceBehaviorBasicAction; label: string }> = [
  { value: "create", label: "新增" },
  { value: "update", label: "修改" },
  { value: "delete", label: "删除" },
];

export const SPACE_BEHAVIOR_BASIC_ACTION_LABELS: Record<SpaceBehaviorBasicAction, string> = {
  create: "新增",
  update: "修改",
  delete: "删除",
  query: "查询",
};

export const SPACE_BEHAVIOR_KIND_OPTIONS: ReadonlyArray<{ value: SpaceBehaviorKind; label: string }> = [
  { value: "basic", label: "基础行为" },
  { value: "application", label: "应用行为" },
  { value: "behaviorTree", label: "行为树" },
];

export const SPACE_BEHAVIOR_KIND_LABELS: Record<SpaceBehaviorKind, string> = {
  basic: "基础行为",
  application: "应用行为",
  behaviorTree: "行为树",
};

export const SPACE_BEHAVIOR_VALUE_TYPE_OPTIONS: ReadonlyArray<{ value: SpaceBehaviorValueType; label: string }> = [
  { value: "attributeValue", label: "属性值" },
  { value: "relationInstance", label: "关系实例" },
  { value: "basicFunctionOperator", label: "基础函数算子" },
];

export const SPACE_BEHAVIOR_VALUE_TYPE_LABELS: Record<SpaceBehaviorValueType, string> = {
  attributeValue: "属性值",
  relationInstance: "关系实例",
  basicFunctionOperator: "基础函数算子",
};

export const SPACE_BEHAVIOR_RELATION_TARGET_STATUS_OPTIONS: ReadonlyArray<{
  value: SpaceBehaviorRelationTargetStatus;
  label: string;
}> = [
  { value: "ENABLE", label: "enable" },
  { value: "DISABLE", label: "disable" },
  { value: "DELETE", label: "delete" },
];

export const SPACE_BEHAVIOR_RELATION_TARGET_STATUS_LABELS: Record<SpaceBehaviorRelationTargetStatus, string> = {
  ENABLE: "enable",
  DISABLE: "disable",
  DELETE: "delete",
};

/**
 * @description 按基础操作返回关系实例状态可选值；新增与修改均为 ENABLE/DISABLE。
 * @param basicAction 基础操作。
 * @returns 可选状态列表；非新增/修改时为空。
 */
export function listSpaceBehaviorRelationTargetStatusOptions(
  basicAction: SpaceBehaviorBasicAction,
): ReadonlyArray<{ value: SpaceBehaviorRelationTargetStatus; label: string }> {
  if (basicAction === "create" || basicAction === "update") {
    return SPACE_BEHAVIOR_RELATION_TARGET_STATUS_OPTIONS.filter((item) => item.value === "ENABLE" || item.value === "DISABLE");
  }
  return [];
}

export const SPACE_BEHAVIOR_APPLICATION_INPUT_SOURCE_OPTIONS: ReadonlyArray<{
  value: SpaceBehaviorApplicationInputSourceType;
  label: string;
}> = [
  { value: "PROPERTY", label: "对象属性" },
  { value: "FIXED", label: "固定值" },
  { value: "EXTERNAL", label: "外部输入" },
];

export const SPACE_BEHAVIOR_APPLICATION_INPUT_SOURCE_LABELS: Record<SpaceBehaviorApplicationInputSourceType, string> = {
  PROPERTY: "对象属性",
  FIXED: "固定值",
  EXTERNAL: "外部输入",
};

export const SPACE_BEHAVIOR_APPLICATION_OUTPUT_MODE_OPTIONS: ReadonlyArray<{
  value: SpaceBehaviorApplicationOutputMode;
  label: string;
}> = [
  { value: "RESULT_ONLY", label: "仅返回结果" },
  { value: "WRITE_PROPERTY", label: "写入对象属性" },
];

export const SPACE_BEHAVIOR_APPLICATION_OUTPUT_MODE_LABELS: Record<SpaceBehaviorApplicationOutputMode, string> = {
  RESULT_ONLY: "仅返回结果",
  WRITE_PROPERTY: "写入对象属性",
};
