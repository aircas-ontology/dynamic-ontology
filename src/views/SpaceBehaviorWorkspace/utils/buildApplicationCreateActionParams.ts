import type {
  CreateOntologyActionMappingIn,
  CreateOntologyActionParams,
  SpaceBehaviorApplicationInputBinding,
  SpaceBehaviorApplicationOutputBinding,
  SpaceBehaviorApplicationParamRowSnapshot,
  SpaceBehaviorDraft,
} from "@/types";

export type BuildApplicationCreateActionParamsResult = CreateOntologyActionParams | { error: string };

/**
 * @description 判断草稿是否走应用行为创建接口。
 * @param draft 行为草稿。
 * @returns 应用行为时为 true。
 */
export function isApplicationActionCreateDraft(draft: SpaceBehaviorDraft): boolean {
  return draft.kind === "application";
}

/**
 * @description 为 WRITE_PROPERTY 出参生成 JsonPath。
 * @param row 出参行快照。
 * @returns 形如 `$.data.<path>` 的表达式。
 */
export function buildApplicationOutputFunctionParamExpression(row: SpaceBehaviorApplicationParamRowSnapshot): string {
  const path = row.fullPath.trim() || row.paramName.trim();
  return `$.data.${path}`;
}

/**
 * @description 组装单条应用行为入参 mappingIns。
 * @param row 入参行。
 * @param binding 入参绑定。
 * @returns mapping 项；校验失败时返回 error。
 */
function buildApplicationInputMapping(
  row: SpaceBehaviorApplicationParamRowSnapshot,
  binding: SpaceBehaviorApplicationInputBinding | undefined,
): CreateOntologyActionMappingIn | { error: string } {
  const functionParamId = row.functionParamId;
  if (typeof functionParamId !== "number" || !Number.isInteger(functionParamId)) {
    return { error: `入参 ${row.paramName || row.rowKey} 缺少函数参数 id` };
  }
  const sourceType = binding?.sourceType ?? "PROPERTY";
  const parameterName = row.paramName.trim();
  const paramPath = row.paramPath.trim();
  const base: CreateOntologyActionMappingIn = {
    functionParamId,
    category: "INPUT",
    sourceType,
    ...(parameterName ? { parameterName } : {}),
    ...(paramPath ? { paramPath } : {}),
  };

  if (sourceType === "PROPERTY") {
    const propertyUniqueIdentifier = binding?.propertyUniqueIdentifier.trim() ?? "";
    const ontologyUniqueIdentifier = binding?.ontologyUniqueIdentifier.trim() ?? "";
    if (!propertyUniqueIdentifier) {
      return { error: `请为入参 ${parameterName || row.rowKey} 选择读取属性` };
    }
    if (!ontologyUniqueIdentifier) {
      return { error: `请为入参 ${parameterName || row.rowKey} 选择对象` };
    }
    return {
      ...base,
      propertyUniqueIdentifier,
      ontologyUniqueIdentifier,
    };
  }

  if (sourceType === "FIXED") {
    const sourceConfig = binding?.fixedValue.trim() ?? "";
    if (!sourceConfig) {
      return { error: `请为入参 ${parameterName || row.rowKey} 填写固定值` };
    }
    return { ...base, sourceConfig };
  }

  // EXTERNAL：默认值 UI 保留但不传 sourceConfig
  return base;
}

/**
 * @description 组装单条应用行为出参 mappingIns。
 * @param row 出参行。
 * @param binding 出参绑定。
 * @returns mapping 项；校验失败时返回 error。
 */
function buildApplicationOutputMapping(
  row: SpaceBehaviorApplicationParamRowSnapshot,
  binding: SpaceBehaviorApplicationOutputBinding | undefined,
): CreateOntologyActionMappingIn | { error: string } {
  const functionParamId = row.functionParamId;
  if (typeof functionParamId !== "number" || !Number.isInteger(functionParamId)) {
    return { error: `出参 ${row.paramName || row.rowKey} 缺少函数参数 id` };
  }
  const parameterName = row.paramName.trim();
  const outputMode = binding?.outputMode ?? "RESULT_ONLY";
  const item: CreateOntologyActionMappingIn = {
    functionParamId,
    category: "OUTPUT",
    outputMode,
    ...(parameterName ? { parameterName } : {}),
  };

  if (outputMode === "RESULT_ONLY") {
    return item;
  }

  const propertyUniqueIdentifier = binding?.propertyUniqueIdentifier.trim() ?? "";
  const ontologyUniqueIdentifier = binding?.ontologyUniqueIdentifier.trim() ?? "";
  if (!propertyUniqueIdentifier) {
    return { error: `请为出参 ${parameterName || row.rowKey} 选择写入属性` };
  }
  if (!ontologyUniqueIdentifier) {
    return { error: `请为出参 ${parameterName || row.rowKey} 选择对象` };
  }
  return {
    ...item,
    functionParamExpression: buildApplicationOutputFunctionParamExpression(row),
    propertyUniqueIdentifier,
    ontologyUniqueIdentifier,
  };
}

/**
 * @description 按应用行为创建约定组装 POST /ontology/action 请求体。
 * @param draft 行为草稿。
 * @returns 请求体；校验失败时返回带 error 的对象。
 */
export function buildApplicationCreateActionParams(draft: SpaceBehaviorDraft): BuildApplicationCreateActionParamsResult {
  const categoryId = Number(draft.categoryId);
  if (!Number.isInteger(categoryId)) {
    return { error: "行为分类无效" };
  }
  const actionApi = draft.behaviorApiName.trim();
  if (!actionApi) {
    return { error: "请填写行为api名称" };
  }
  const displayName = draft.displayName.trim();
  if (!displayName) {
    return { error: "请填写行为名称" };
  }
  const functionApi = draft.functionOperatorId.trim();
  if (!functionApi) {
    return { error: "请选择关联函数算子" };
  }
  const ontologyLinkUniqIdentifier = draft.selectedRelationId.trim();

  const mappingIns: CreateOntologyActionMappingIn[] = [];
  const inputRows = draft.applicationInputRows.filter((row) => !row.isObject);
  for (const row of inputRows) {
    const mapped = buildApplicationInputMapping(row, draft.applicationInputBindings[row.rowKey]);
    if ("error" in mapped) return mapped;
    mappingIns.push(mapped);
  }

  const outputRows = draft.applicationOutputRows.filter((row) => !row.isObject);
  for (const row of outputRows) {
    const mapped = buildApplicationOutputMapping(row, draft.applicationOutputBindings[row.rowKey]);
    if ("error" in mapped) return mapped;
    mappingIns.push(mapped);
  }

  if (!mappingIns.some((item) => item.category === "INPUT")) {
    return { error: "请至少配置一条入参绑定" };
  }

  const description = draft.description.trim();
  return {
    actionApi,
    displayName,
    ...(description ? { description } : {}),
    categoryId,
    actionKind: "APPLICATION",
    functionApi,
    ...(ontologyLinkUniqIdentifier ? { linkMapping: { ontologyLinkUniqIdentifier } } : {}),
    mappingIns,
  };
}
