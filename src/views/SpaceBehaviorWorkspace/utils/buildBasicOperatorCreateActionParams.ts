import type { CreateOntologyActionMappingIn, CreateOntologyActionParams, SpaceBehaviorDraft } from "@/types";

export type BuildBasicOperatorCreateActionParamsResult = CreateOntologyActionParams | { error: string };

/**
 * @description 判断草稿是否走基础算子行为创建接口。
 * @param draft 行为草稿。
 * @returns 基础行为 + 基础函数算子时为 true。
 */
export function isBasicOperatorActionCreateDraft(draft: SpaceBehaviorDraft): boolean {
  return draft.kind === "basic" && draft.valueType === "basicFunctionOperator";
}

/**
 * @description 按基础算子创建约定组装 POST /ontology/action 请求体。
 * @param draft 行为草稿。
 * @returns 请求体；校验失败时返回带 error 的对象。
 */
export function buildBasicOperatorCreateActionParams(draft: SpaceBehaviorDraft): BuildBasicOperatorCreateActionParamsResult {
  const categoryId = Number(draft.categoryId);
  if (!Number.isInteger(categoryId)) {
    return { error: "行为分类无效" };
  }
  const ontologyIdentifier = draft.ontologyIdentifier.trim();
  if (!ontologyIdentifier) {
    return { error: "请选择对象" };
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
    return { error: "请选择函数基础算子" };
  }

  const bindingEntries = Object.entries(draft.operatorParamBindings).filter(([parameterName]) => parameterName.trim());
  const mappingIns: CreateOntologyActionMappingIn[] = [];
  for (const [rawName, rawApiName] of bindingEntries) {
    const parameterName = rawName.trim();
    const sourceConfig = rawApiName.trim();
    if (!sourceConfig) {
      return { error: `请为参数 ${parameterName} 选择对象属性` };
    }
    const functionParamId = draft.operatorParamIds[parameterName];
    if (typeof functionParamId !== "number" || !Number.isInteger(functionParamId)) {
      return { error: `参数 ${parameterName} 缺少函数入参 id，请重新选择算子` };
    }
    mappingIns.push({
      functionParamId,
      parameterName,
      sourceType: "FIXED",
      sourceConfig,
    });
  }

  const description = draft.description.trim();
  return {
    actionApi,
    displayName,
    ...(description ? { description } : {}),
    categoryId,
    ontologyIdentifier,
    actionKind: "BASE",
    subjectType: "BASIC_OPERATOR",
    functionApi,
    outputMode: "RESULT_ONLY",
    ...(mappingIns.length ? { mappingIns } : {}),
  };
}
