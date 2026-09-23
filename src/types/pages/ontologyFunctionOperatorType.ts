/** 空间函数算子页面类型（本阶段以基础函数为主） */

export type FunctionOperatorType = "code" | "api" | "docker" | "composite" | "basic";
export type FunctionOperatorBasicAction = "create" | "update" | "delete";
export type FunctionOperatorStatus = "draft" | "testing" | "published" | "disabled";
export type FunctionOperatorProtocol = "HTTP" | "gRPC" | "MQ";
export type FunctionOperatorParameterType = "string" | "number" | "boolean" | "object" | "array";
export type FunctionOperatorSortBy = "updatedAt" | "name";
export type FunctionOperatorSortOrder = "asc" | "desc";
export type FunctionOperatorTestStatus = "untested" | "passed" | "failed";
export type FunctionOperatorViewMode = "card" | "table";

export interface FunctionOperatorParameterField {
  id: string;
  name: string;
  type: FunctionOperatorParameterType;
  required: boolean;
  description: string;
  itemFields?: FunctionOperatorParameterField[];
}

export interface FunctionOperatorParameter {
  id: string;
  name: string;
  type: FunctionOperatorParameterType;
  required: boolean;
  description: string;
  itemFields?: FunctionOperatorParameterField[];
}

export interface FunctionOperatorVersion {
  id: string;
  version: string;
  status: FunctionOperatorStatus;
  createdAt: string;
  createdBy: string;
  changeLog: string;
}

export interface FunctionOperatorBasicDefinition {
  kind: "basic";
  parameterConfig: string;
  basicAction?: FunctionOperatorBasicAction;
  objectId?: string;
  objectName?: string;
}

/** 非基础函数占位定义（本阶段不实现配置 UI）。 */
export interface FunctionOperatorPlaceholderDefinition {
  kind: Exclude<FunctionOperatorType, "basic">;
}

export type FunctionOperatorDefinition = FunctionOperatorBasicDefinition | FunctionOperatorPlaceholderDefinition;

export interface FunctionOperator {
  id: string;
  spaceId: number;
  name: string;
  type: FunctionOperatorType;
  protocol: FunctionOperatorProtocol;
  version: string;
  description: string;
  createdBy: string;
  updatedAt: string;
  status: FunctionOperatorStatus;
  category: string;
  inputParameters: FunctionOperatorParameter[];
  outputParameters: FunctionOperatorParameter[];
  timeout: number;
  retryCount: number;
  retryInterval: number;
  definition: FunctionOperatorDefinition;
  dependencies: string[];
  testStatus: FunctionOperatorTestStatus;
  testedAt: string;
  versions: FunctionOperatorVersion[];
}

export type FunctionOperatorDraft = Omit<FunctionOperator, "id" | "updatedAt" | "versions"> & {
  id?: string;
};

export interface FunctionOperatorQuery {
  spaceId: number;
  keyword: string;
  type: FunctionOperatorType | "";
  creator: string;
  status: FunctionOperatorStatus | "";
  updatedFrom: string;
  updatedTo: string;
  page: number;
  pageSize: number;
  sortBy: FunctionOperatorSortBy;
  sortOrder: FunctionOperatorSortOrder;
}

export interface FunctionOperatorPage {
  records: FunctionOperator[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FunctionOperatorTestResult {
  success: boolean;
  duration: number;
  output: string;
  message: string;
  testedAt: string;
}

export const FUNCTION_OPERATOR_TYPE_OPTIONS: ReadonlyArray<{ value: FunctionOperatorType; label: string; description: string }> = [
  { value: "basic", label: "基础函数", description: "配置基础参数的轻量函数" },
  { value: "code", label: "脚本函数", description: "本阶段暂未开放" },
  { value: "api", label: "外部 API 函数", description: "本阶段暂未开放" },
  { value: "docker", label: "容器算子函数", description: "本阶段暂未开放" },
  { value: "composite", label: "函数编排", description: "本阶段暂未开放" },
];

export const FUNCTION_OPERATOR_STATUS_OPTIONS: ReadonlyArray<{ value: FunctionOperatorStatus; label: string }> = [
  { value: "draft", label: "草稿" },
  { value: "testing", label: "测试中" },
  { value: "published", label: "已发布" },
  { value: "disabled", label: "已停用" },
];

export const FUNCTION_OPERATOR_TYPE_LABELS: Record<FunctionOperatorType, string> = {
  basic: "基础函数",
  code: "脚本函数",
  api: "外部 API 函数",
  docker: "容器算子函数",
  composite: "函数编排",
};

export const FUNCTION_OPERATOR_STATUS_LABELS: Record<FunctionOperatorStatus, string> = {
  draft: "草稿",
  testing: "测试中",
  published: "已发布",
  disabled: "已停用",
};
