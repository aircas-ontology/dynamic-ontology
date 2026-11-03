/** 空间内行为工作台业务契约。 */

export const ROOT_SPACE_BEHAVIOR_CATEGORY_ID = "behavior-root";

export type SpaceBehaviorStatus = "published" | "draft" | "disabled";

/** 行为列表筛选项：对接 listAction 的启用/失效。 */
export type SpaceBehaviorListStatus = "enabled" | "disabled";

export type SpaceBehaviorStatusOperation = "publish" | "disable" | "draft";

export type SpaceBehaviorBasicAction = "create" | "update" | "delete" | "query";

/** 行为创建表单顶层类别：基础行为 / 应用行为 / 行为树。 */
export type SpaceBehaviorKind = "basic" | "application" | "behaviorTree";

/** 基础行为的行为类型。 */
export type SpaceBehaviorValueType = "attributeValue" | "relationInstance" | "basicFunctionOperator";

/** 关系实例 linkMapping.targetStatus。 */
export type SpaceBehaviorRelationTargetStatus = "ENABLE" | "DELETE";

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
  { value: "enabled", label: "启用" },
  { value: "disabled", label: "失效" },
];

export const SPACE_BEHAVIOR_LIST_STATUS_LABELS: Record<SpaceBehaviorListStatus, string> = {
  enabled: "启用",
  disabled: "失效",
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
  { value: "DELETE", label: "delete" },
];

export const SPACE_BEHAVIOR_RELATION_TARGET_STATUS_LABELS: Record<SpaceBehaviorRelationTargetStatus, string> = {
  ENABLE: "enable",
  DELETE: "delete",
};
