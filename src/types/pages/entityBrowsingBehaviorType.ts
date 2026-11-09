export type PowerBehaviorGroupId = "business-process" | "application-analysis" | "basic-operation";

export type PowerBehaviorCategoryId =
  "behavior-tree" | "perception" | "analysis" | "planning" | "command-control" | "comprehensive-support" | "relation" | "attribute-update";

export type BehaviorImplementationMode = "内置函数" | "规则引擎" | "微服务" | "模型服务" | "HTTP服务" | "容器镜像" | "MCP工具" | "规则触发" | "定时调度";

export type BehaviorOntologyScope = "单本体" | "跨本体";

export type BehaviorBuildMethod = "手动构建" | "AI抽取";

export type BehaviorServiceStatus = "在线" | "维护中" | "已停用" | "已注册";

export interface PowerBehaviorGroup {
  id: PowerBehaviorGroupId;
  name: string;
}

export interface PowerBehaviorCategory {
  id: PowerBehaviorCategoryId;
  groupId: PowerBehaviorGroupId;
  name: string;
  description: string;
  icon: string;
}

export interface PowerBehaviorCategorySummary extends PowerBehaviorCategory {
  count: number;
}

export interface PowerBehaviorGroupSummary extends PowerBehaviorGroup {
  count: number;
  categories: readonly PowerBehaviorCategorySummary[];
}

export interface PowerBehaviorInstance {
  id: string;
  categoryId: PowerBehaviorCategoryId;
  icon: string;
  name: string;
  type: string;
  mountedFunction: string;
  implementationMode: BehaviorImplementationMode;
  serviceStatus: BehaviorServiceStatus;
  executionCount: number;
  publishedAt: string;
  description?: string;
  relatedBehaviors?: readonly string[];
  ontologyScope?: BehaviorOntologyScope;
  buildMethod?: BehaviorBuildMethod;
}

export type PowerExecutionStatus = "success" | "failed" | "running";

export type PowerExecutionTrigger = "状态变化触发" | "手动调用" | "定时触发";

export type PowerExecutionStatusFilter = "全部" | "成功" | "异常";

export type PowerExecutionTimeRange = "近7天" | "近30天" | "自定义";

export interface PowerExecutionRecordDetail {
  executionId: string;
  inputDescription: string;
  duration: number | null;
  status: PowerExecutionStatus;
  logo: string;
  outputSummary: string;
}

export interface PowerExecutionRecord {
  executionId: string;
  time: string;
  trigger: PowerExecutionTrigger;
  inputDescription: string;
  version: string;
  duration: number | null;
  remark: string;
  status: PowerExecutionStatus;
  logo: string;
  detail: PowerExecutionRecordDetail;
}

export interface PowerExecutionStatistics {
  total: number;
  success: number;
  failed: number;
  avgDuration: number;
  latestExecution: string;
}

export interface PowerExecutionFilterOptions {
  timeRange: readonly PowerExecutionTimeRange[];
  executionStatus: readonly PowerExecutionStatusFilter[];
  triggerType: readonly string[];
  functionVersion: readonly string[];
}

export interface PowerExecutionDataSet {
  statistics: PowerExecutionStatistics;
  filterOptions: PowerExecutionFilterOptions;
  executionRecords: readonly PowerExecutionRecord[];
  pageSize: number;
}
