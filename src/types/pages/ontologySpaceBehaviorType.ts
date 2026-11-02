/** 空间内行为工作台业务契约。 */

export const ROOT_SPACE_BEHAVIOR_CATEGORY_ID = "behavior-root";

export type SpaceBehaviorStatus = "published" | "draft" | "disabled";

export type SpaceBehaviorStatusOperation = "publish" | "disable" | "draft";

export type SpaceBehaviorBasicAction = "create" | "update" | "delete" | "query";

/** 行为创建表单顶层类别：基础行为 / 应用行为 / 行为树。 */
export type SpaceBehaviorKind = "basic" | "application" | "behaviorTree";

/** 基础行为的行为类型。 */
export type SpaceBehaviorValueType = "attributeValue" | "relationExample" | "basicFunctionOperator";

export type SpaceBehaviorWorkspaceLoadStatus = "loading" | "ready" | "empty" | "error";

export interface SpaceBehaviorCategoryNode {
  id: string;
  label: string;
  count: number;
  children: SpaceBehaviorCategoryNode[];
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
  kind: SpaceBehaviorKind;
  valueType: SpaceBehaviorValueType;
  functionOperatorId: string;
  functionOperatorName: string;
  description: string;
  categoryId: string;
  status: SpaceBehaviorStatus;
  basicAction: SpaceBehaviorBasicAction;
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
  { value: "relationExample", label: "关系示例" },
  { value: "basicFunctionOperator", label: "基础函数算子" },
];

export const SPACE_BEHAVIOR_VALUE_TYPE_LABELS: Record<SpaceBehaviorValueType, string> = {
  attributeValue: "属性值",
  relationExample: "关系示例",
  basicFunctionOperator: "基础函数算子",
};
