/** 空间内行为工作台业务契约。 */

export const ROOT_SPACE_BEHAVIOR_CATEGORY_ID = "behavior-root";

export type SpaceBehaviorStatus = "published" | "draft" | "disabled";

export type SpaceBehaviorStatusOperation = "publish" | "disable" | "draft";

export type SpaceBehaviorBasicAction = "create" | "update" | "delete" | "query";

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
  { value: "create", label: "新增对象" },
  { value: "update", label: "修改对象" },
  { value: "delete", label: "删除对象" },
  { value: "query", label: "查询对象" },
];

export const SPACE_BEHAVIOR_BASIC_ACTION_LABELS: Record<SpaceBehaviorBasicAction, string> = {
  create: "新增对象",
  update: "修改对象",
  delete: "删除对象",
  query: "查询对象",
};
