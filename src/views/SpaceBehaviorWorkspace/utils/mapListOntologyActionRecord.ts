import type {
  ListOntologyActionRecord,
  SpaceBehaviorBasicAction,
  SpaceBehaviorItem,
  SpaceBehaviorKind,
  SpaceBehaviorListStatus,
  SpaceBehaviorStatus,
  SpaceBehaviorValueType,
} from "@/types";

/**
 * @description 将列表接口状态码映射为工作区行为状态。
 * @param status 接口状态：1 已发布，2 草稿。
 * @returns published 或 draft。
 */
export function mapListOntologyActionStatus(status: number): SpaceBehaviorStatus {
  return status === 1 ? "published" : "draft";
}

/**
 * @description 将工作区行为状态映射为列表筛选项已发布/草稿。
 * @param status 行为状态。
 * @returns 列表状态。
 */
export function mapSpaceBehaviorItemToListStatus(status: SpaceBehaviorStatus): SpaceBehaviorListStatus {
  return status === "published" ? "published" : "draft";
}

/**
 * @description 将列表筛选项映射为接口 status 查询值。
 * @param status 列表筛选项；空表示不筛选。
 * @returns 1 / 2；未选时为 undefined。
 */
export function mapSpaceBehaviorListStatusToQuery(status: SpaceBehaviorListStatus | ""): number | undefined {
  if (status === "published") return 1;
  if (status === "draft") return 2;
  return undefined;
}

/**
 * @description 将接口 actionKind 映射为表单类别。
 * @param actionKind 接口行为类别。
 * @returns 工作区 kind。
 */
function mapActionKindToSpaceBehaviorKind(actionKind: string): SpaceBehaviorKind {
  if (actionKind === "APPLICATION") return "application";
  if (actionKind === "TREE") return "behaviorTree";
  return "basic";
}

/**
 * @description 将接口 subjectType 映射为行为类型。
 * @param subjectType 接口主体类型。
 * @returns 工作区 valueType。
 */
function mapSubjectTypeToValueType(subjectType: string): SpaceBehaviorValueType {
  if (subjectType === "LINK") return "relationInstance";
  if (subjectType === "BASIC_OPERATOR") return "basicFunctionOperator";
  return "attributeValue";
}

/**
 * @description 将接口 operation 映射为基础操作；缺失或未知值不回落为 create。
 * @param operation 接口操作。
 * @returns 工作区 basicAction；缺失或未知时为空字符串。
 */
function mapOperationToBasicAction(operation: string | null | undefined): SpaceBehaviorBasicAction | "" {
  const normalized = (operation ?? "").trim().toUpperCase();
  if (normalized === "CREATE") return "create";
  if (normalized === "UPDATE") return "update";
  if (normalized === "DELETE") return "delete";
  if (normalized === "QUERY") return "query";
  return "";
}

/**
 * @description 将行为列表接口记录映射为表格行。
 * @param record 接口记录。
 * @returns 工作区行为项。
 */
export function mapListOntologyActionRecord(record: ListOntologyActionRecord): SpaceBehaviorItem {
  const functionOperatorName = (record.functionApi ?? "").trim() || (record.functionDescription ?? "").trim() || "-";
  return {
    id: String(record.id),
    categoryId: String(record.categoryId),
    displayName: record.displayName.trim() || record.actionApi.trim() || "-",
    kind: mapActionKindToSpaceBehaviorKind(record.actionKind),
    valueType: mapSubjectTypeToValueType(record.subjectType),
    functionOperatorId: (record.functionApi ?? "").trim(),
    functionOperatorName,
    functionOperatorVersion: "",
    description: record.description?.trim() || "",
    status: mapListOntologyActionStatus(record.status),
    version: "",
    basicAction: mapOperationToBasicAction(record.operation),
    objectName: "",
    ontologyUniqIdentifier: (record.ontologyUniqIdentifier ?? "").trim(),
    behaviorApiName: record.actionApi.trim(),
    executionPeriod: "",
    singleObject: false,
    executionCount: 0,
    successRate: "",
    publisher: "",
    publishedAt: "",
    changeNote: "",
    statusLogs: [],
    inputParameters: [],
    outputParameters: [],
    updatedAt: record.updateTime?.trim() || "-",
  };
}
