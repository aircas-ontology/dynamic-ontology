import type { GetOntologyActionInfoData, GetOntologyActionInfoFunctionParam, GetOntologyActionInfoMappingIn, SpaceBehaviorStatus } from "@/types";

/** 行为查看入出参行。 */
export interface SpaceBehaviorActionInfoViewParamRow {
  rowKey: string;
  paramName: string;
  paramPath: string;
  paramType: string;
  /** 属性展示名称（mappingIns.displayName）。 */
  propertyDisplayName: string;
  /** 属性类型（mappingIns.propertyType）。 */
  propertyType: string;
  description: string;
  sourceType: string;
  sourceConfig: string;
  propertyUniqueIdentifier: string;
  ontologyUniqueIdentifier: string;
  functionParamExpression: string;
  outputMode: string;
  /** mappingIns.storageGroup；应用行为测试非 main 时需选子表行。 */
  storageGroup: string;
  /** 绑定摘要文案。 */
  bindSummary: string;
}

/** 行为查看详情展示状态。 */
export interface SpaceBehaviorActionInfoViewState {
  id: string;
  actionApi: string;
  displayName: string;
  description: string;
  status: SpaceBehaviorStatus;
  actionKindLabel: string;
  subjectTypeLabel: string;
  operationLabel: string;
  ontologyUniqIdentifier: string;
  storageGroup: string;
  functionApi: string;
  functionDescription: string;
  outputMode: string;
  linkRelationId: string;
  linkTargetStatus: string;
  inputRows: SpaceBehaviorActionInfoViewParamRow[];
  outputRows: SpaceBehaviorActionInfoViewParamRow[];
}

/**
 * @description 将详情状态码映射为工作区行为状态。
 * @param status 接口状态：1 已发布，其余按草稿。
 * @returns published 或 draft。
 */
function mapActionInfoStatus(status: number): SpaceBehaviorStatus {
  return status === 1 ? "published" : "draft";
}

/**
 * @description 映射行为类别展示文案。
 * @param actionKind 接口行为类别。
 * @returns 中文标签。
 */
function mapActionKindLabel(actionKind: string): string {
  if (actionKind === "APPLICATION") return "应用行为";
  if (actionKind === "BASE") return "基础行为";
  return actionKind || "—";
}

/**
 * @description 映射主体类型展示文案。
 * @param subjectType 接口主体类型。
 * @returns 中文标签。
 */
function mapSubjectTypeLabel(subjectType: string): string {
  if (subjectType === "PROPERTY_VALUE") return "属性值";
  if (subjectType === "LINK") return "关系实例";
  if (subjectType === "BASIC_OPERATOR") return "基础函数算子";
  return subjectType || "—";
}

/**
 * @description 映射操作类型展示文案。
 * @param operation 接口操作。
 * @returns 中文标签。
 */
function mapOperationLabel(operation: string): string {
  if (operation === "CREATE") return "新增";
  if (operation === "UPDATE") return "修改";
  if (operation === "DELETE") return "删除";
  if (operation === "QUERY") return "查询";
  return operation || "—";
}

/**
 * @description 按 functionParamId 查找函数参数定义。
 * @param functionParams 函数参数列表。
 * @param functionParamId 参数 id。
 * @returns 参数定义；未找到为 null。
 */
function findFunctionParam(
  functionParams: GetOntologyActionInfoFunctionParam[],
  functionParamId: number | null | undefined,
): GetOntologyActionInfoFunctionParam | null {
  if (typeof functionParamId !== "number" || !Number.isInteger(functionParamId)) return null;
  return functionParams.find((item) => item.paramId === functionParamId) ?? null;
}

/**
 * @description 判断 mappingIns 行属于入参还是出参。
 * @param item mapping 行。
 * @param functionParam 对应函数参数定义。
 * @returns INPUT 或 OUTPUT。
 */
function resolveMappingCategory(item: GetOntologyActionInfoMappingIn, functionParam: GetOntologyActionInfoFunctionParam | null): "INPUT" | "OUTPUT" {
  const rawCategory = (item.category ?? "").trim().toUpperCase();
  if (rawCategory === "OUTPUT") return "OUTPUT";
  if (rawCategory === "INPUT") return "INPUT";
  const paramCategory = (functionParam?.category ?? "").trim().toUpperCase();
  if (paramCategory === "OUTPUT") return "OUTPUT";
  if (paramCategory === "INPUT") return "INPUT";
  const expression = (item.functionParamExpression ?? "").trim();
  const outputMode = (item.outputMode ?? "").trim().toUpperCase();
  if (expression || outputMode === "WRITE_PROPERTY" || outputMode === "RESULT_ONLY") return "OUTPUT";
  return "INPUT";
}

/**
 * @description 组装入出参绑定摘要。
 * @param item mapping 行。
 * @param category 入出参类别。
 * @returns 摘要文案。
 */
function buildBindSummary(item: GetOntologyActionInfoMappingIn, category: "INPUT" | "OUTPUT"): string {
  if (category === "OUTPUT") {
    const outputMode = (item.outputMode ?? "").trim().toUpperCase();
    const expression = (item.functionParamExpression ?? "").trim();
    const propertyId = (item.propertyUniqueIdentifier ?? "").trim();
    if (outputMode === "WRITE_PROPERTY" || propertyId) {
      const parts = [expression || "写回属性", propertyId ? `属性 ${propertyId}` : ""].filter(Boolean);
      return parts.join(" → ") || "写回属性";
    }
    if (expression) return `仅返回 ${expression}`;
    return "仅返回结果";
  }
  const sourceType = (item.sourceType ?? "").trim().toUpperCase();
  const sourceConfig = (item.sourceConfig ?? "").trim();
  const propertyId = (item.propertyUniqueIdentifier ?? "").trim();
  if (sourceType === "PROPERTY") return propertyId ? `对象属性 ${propertyId}` : "对象属性";
  if (sourceType === "FIXED") return sourceConfig ? `固定值 ${sourceConfig}` : "固定值";
  if (sourceType === "EXTERNAL") return "外部输入";
  if (sourceType === "OBJECT") return propertyId ? `对象 ${propertyId}` : "对象";
  if (sourceType === "LIST") return propertyId ? `列表 ${propertyId}` : "列表";
  if (propertyId) return `属性 ${propertyId}`;
  if (sourceConfig) return sourceConfig;
  return "—";
}

/**
 * @description 将 mappingIns 行映射为查看表格行。
 * @param item mapping 行。
 * @param index 行序号。
 * @param functionParam 函数参数定义。
 * @param category 入出参类别。
 * @returns 查看表格行。
 */
function mapMappingToViewRow(
  item: GetOntologyActionInfoMappingIn,
  index: number,
  functionParam: GetOntologyActionInfoFunctionParam | null,
  category: "INPUT" | "OUTPUT",
): SpaceBehaviorActionInfoViewParamRow {
  const paramName = (item.parameterName ?? "").trim() || (functionParam?.paramName ?? "").trim() || "—";
  const paramPath = (item.paramPath ?? "").trim();
  const propertyDisplayName = (item.displayName ?? "").trim();
  const propertyType = (item.propertyType ?? "").trim();
  const functionParamId = item.functionParamId;
  const rowKey =
    typeof functionParamId === "number" && Number.isInteger(functionParamId)
      ? `${category}-${functionParamId}-${paramPath || paramName}-${index}`
      : `${category}-${paramName}-${index}`;
  return {
    rowKey,
    paramName,
    paramPath,
    paramType: propertyType || (functionParam?.paramType ?? "").trim() || "—",
    propertyDisplayName,
    propertyType,
    description: (functionParam?.description ?? "").trim(),
    sourceType: (item.sourceType ?? "").trim() || "—",
    sourceConfig: (item.sourceConfig ?? "").trim(),
    propertyUniqueIdentifier: (item.propertyUniqueIdentifier ?? "").trim(),
    ontologyUniqueIdentifier: (item.ontologyUniqueIdentifier ?? "").trim(),
    functionParamExpression: (item.functionParamExpression ?? "").trim(),
    outputMode: (item.outputMode ?? "").trim(),
    storageGroup: (item.storageGroup ?? "").trim(),
    bindSummary: buildBindSummary(item, category),
  };
}

/**
 * @description 将行为详情接口 data 映射为查看抽屉展示状态。
 * @param data 行为详情。
 * @returns 查看展示状态。
 */
export function mapOntologyActionInfoToViewState(data: GetOntologyActionInfoData): SpaceBehaviorActionInfoViewState {
  const functionParams = Array.isArray(data.functionParams) ? data.functionParams : [];
  const mappingIns = Array.isArray(data.mappingIns) ? data.mappingIns : [];
  const inputRows: SpaceBehaviorActionInfoViewParamRow[] = [];
  const outputRows: SpaceBehaviorActionInfoViewParamRow[] = [];

  mappingIns.forEach((item, index) => {
    const functionParam = findFunctionParam(functionParams, item.functionParamId);
    const category = resolveMappingCategory(item, functionParam);
    const row = mapMappingToViewRow(item, index, functionParam, category);
    if (category === "OUTPUT") outputRows.push(row);
    else inputRows.push(row);
  });

  const linkMapping = data.linkMapping;
  return {
    id: String(data.id),
    actionApi: (data.actionApi ?? "").trim(),
    displayName: (data.displayName ?? "").trim() || (data.actionApi ?? "").trim() || "行为详情",
    description: (data.description ?? "").trim(),
    status: mapActionInfoStatus(data.status),
    actionKindLabel: mapActionKindLabel((data.actionKind ?? "").trim()),
    subjectTypeLabel: mapSubjectTypeLabel((data.subjectType ?? "").trim()),
    operationLabel: mapOperationLabel((data.operation ?? "").trim()),
    ontologyUniqIdentifier: (data.ontologyUniqIdentifier ?? "").trim(),
    storageGroup: (data.storageGroup ?? "").trim(),
    functionApi: (data.functionApi ?? "").trim(),
    functionDescription: (data.functionDescription ?? "").trim(),
    outputMode: (data.outputMode ?? "").trim(),
    linkRelationId: (linkMapping?.ontologyLinkUniqIdentifier ?? "").trim(),
    linkTargetStatus: (linkMapping?.targetStatus ?? "").trim(),
    inputRows,
    outputRows,
  };
}
