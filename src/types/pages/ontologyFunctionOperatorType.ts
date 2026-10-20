/** 空间函数算子页面类型（本阶段以基础函数为主） */

import type { CreateOntologyFunctionAggFunc, CreateOntologyFunctionApiConfig } from "../apis/createOntologyFunctionType";

export type FunctionOperatorType = "code" | "api" | "docker" | "composite" | "basic";
export type FunctionOperatorBasicAction = "create" | "update" | "delete";
export type FunctionOperatorStatus = "draft" | "testing" | "published" | "disabled" | "";
export type FunctionOperatorProtocol = "HTTP" | "gRPC" | "MQ" | "";
export type FunctionOperatorParameterType = "string" | "number" | "boolean" | "object" | "array";
export type FunctionOperatorSortBy = "updatedAt" | "name";
export type FunctionOperatorSortOrder = "asc" | "desc";
export type FunctionOperatorTestStatus = "untested" | "passed" | "failed";
export type FunctionOperatorViewMode = "card" | "table";
export type FunctionOperatorAggFunc = CreateOntologyFunctionAggFunc;
/** 脚本函数 Web-IDE 可选语言。 */
export type FunctionOperatorScriptLanguage = "typescript" | "groovy" | "python" | "java";

export interface FunctionOperatorParameterField {
  id: string;
  name: string;
  type: FunctionOperatorParameterType;
  required: boolean;
  description: string;
  /** 接口原始 paramType，用于参数树展示。 */
  apiParamType?: string;
  itemFields?: FunctionOperatorParameterField[];
}

export interface FunctionOperatorParameter {
  id: string;
  name: string;
  type: FunctionOperatorParameterType;
  required: boolean;
  description: string;
  /** 接口原始 paramType，用于参数树展示。 */
  apiParamType?: string;
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
  /** 可选聚合类型；空表示创建时不传 queryConfig.aggFunc。 */
  aggFunc?: FunctionOperatorAggFunc | "";
  /** 可选聚合参数名；对应 queryConfig.targetProperty。 */
  targetProperty?: string;
  basicAction?: FunctionOperatorBasicAction;
  objectId?: string;
  objectName?: string;
}

/** 脚本函数定义（编辑 / 基于已有创建回显与 IDE 草稿）。 */
export interface FunctionOperatorCodeDefinition {
  kind: "code";
  /** 脚本语言。 */
  language: FunctionOperatorScriptLanguage;
  /** 脚本源码，对应详情 data.code。 */
  code: string;
}

/** 非基础、非脚本函数占位定义（本阶段不实现配置 UI）。 */
export interface FunctionOperatorPlaceholderDefinition {
  kind: Exclude<FunctionOperatorType, "basic" | "code">;
}

export type FunctionOperatorDefinition = FunctionOperatorBasicDefinition | FunctionOperatorCodeDefinition | FunctionOperatorPlaceholderDefinition;

export interface FunctionOperator {
  id: string;
  spaceId: number;
  name: string;
  /** 函数 API 名称，对应创建接口 functionApi。 */
  functionApi: string;
  type: FunctionOperatorType;
  /** 列表接口原始 type（如 BASIC_QUERY / CUSTOMIZE），用于展示映射。 */
  apiModelType?: string;
  protocol: FunctionOperatorProtocol;
  version: string;
  description: string;
  createdBy: string;
  /** 创建时间（列表 createTime 格式化后）。 */
  createdAt: string;
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
  /** 外部 API 详情中的 apiConfig，用于编辑回显。 */
  externalApiConfig?: CreateOntologyFunctionApiConfig;
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
  { value: "code", label: "脚本函数", description: "通过脚本编写自定义函数逻辑" },
  { value: "api", label: "外部 API 函数", description: "调用外部 HTTP 接口" },
  { value: "docker", label: "容器算子函数", description: "本阶段暂未开放" },
  { value: "composite", label: "函数编排", description: "通过编排多个函数构建复杂流程" },
];

export const FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: FunctionOperatorScriptLanguage;
  label: string;
}> = [
  { value: "typescript", label: "TypeScript" },
  { value: "groovy", label: "Groovy" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
];

export const FUNCTION_OPERATOR_AGG_FUNC_OPTIONS: ReadonlyArray<{ value: FunctionOperatorAggFunc; label: string }> = [
  { value: "SUM", label: "SUM（求和）" },
  { value: "COUNT", label: "COUNT（计数）" },
  { value: "AVG", label: "AVG（平均）" },
  { value: "MAX", label: "MAX（最大）" },
  { value: "MIN", label: "MIN（最小）" },
  { value: "DISTINCT", label: "DISTINCT（去重）" },
];

export const FUNCTION_OPERATOR_STATUS_OPTIONS: ReadonlyArray<{ value: FunctionOperatorStatus; label: string }> = [
  { value: "draft", label: "草稿" },
  { value: "testing", label: "测试中" },
  { value: "published", label: "已发布" },
  { value: "disabled", label: "已停用" },
];

/** 列表筛选可用的发布状态（与接口 publishStatus 0/1 对齐）。 */
export const FUNCTION_OPERATOR_PUBLISH_STATUS_OPTIONS: ReadonlyArray<{ value: Extract<FunctionOperatorStatus, "draft" | "published">; label: string }> = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
];

export const FUNCTION_OPERATOR_TYPE_LABELS: Record<FunctionOperatorType, string> = {
  basic: "基础函数",
  code: "脚本函数",
  api: "外部 API 函数",
  docker: "容器算子函数",
  composite: "函数编排",
};

export const FUNCTION_OPERATOR_STATUS_LABELS: Record<Exclude<FunctionOperatorStatus, "">, string> = {
  draft: "草稿",
  testing: "测试中",
  published: "已发布",
  disabled: "已停用",
};
